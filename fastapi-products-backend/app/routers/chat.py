import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_local import (
    apply_followup_intent,
    closest_alternatives,
    detect_language,
    detect_followup_intent,
    extract_filters_rule_based,
    format_no_results_message,
    format_response,
    get_session_filters,
    get_session_last_results,
    merge_filters,
    next_viable_budget,
    query_products,
    save_session,
)

router = APIRouter(prefix="/chat", tags=["chat"])

logger = logging.getLogger(__name__)


def _serialize_products(products: list) -> list[dict]:
    return [
        {
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "brand": p.brand,
            "cpu": p.cpu,
            "ram_gb": p.ram_gb,
            "storage_gb": p.storage_gb,
            "gpu": p.gpu,
            "screen_inches": p.screen_inches,
            "weight_kg": p.weight_kg,
            "battery_hours": p.battery_hours,
            "os": p.os,
            "category": p.category,
            "resolution": p.resolution,
            "refresh_hz": p.refresh_hz,
            "cover_photo": p.cover_photo,
        }
        for p in products
    ]


def _no_results_actions(*, language: str, filters: dict, db: Session) -> list[dict]:
    actions: list[dict] = []
    next_budget = next_viable_budget(db, filters)
    category = str(filters.get("category") or "laptop").lower()

    if next_budget is not None:
        budget_int = int(next_budget)
        if language == "en":
            actions.append(
                {
                    "label": f"Increase budget ({budget_int} RON)",
                    "prompt": f"{category} under {budget_int} RON",
                }
            )
        else:
            actions.append(
                {
                    "label": f"Mărește bugetul ({budget_int} RON)",
                    "prompt": f"{category} sub {budget_int} RON",
                }
            )
    elif language == "en":
        actions.append({"label": "Increase budget", "prompt": "Show options with a higher budget"})
    else:
        actions.append({"label": "Mărește bugetul", "prompt": "Arată opțiuni cu buget mai mare"})

    if language == "en":
        actions.append({"label": "Show closest alternatives", "prompt": "Show closest alternatives"})
    else:
        actions.append({"label": "Arată alternative apropiate", "prompt": "Arată alternative apropiate"})

    return actions

@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    prev = get_session_filters(payload.session_id)
    low_message = payload.message.strip().lower()
    requested_language = payload.language if payload.language in {"ro", "en"} else detect_language(payload.message)

    if settings.local_bot_mode == "rule_based":
        try:
            language = requested_language
            new_filters = extract_filters_rule_based(payload.message)
            intent = None
            sort_by = "price_asc"

            if len(new_filters) <= 1:
                intent = detect_followup_intent(payload.message, language)

            if intent and len(new_filters) == 0:
                last_results = get_session_last_results(payload.session_id)
                adjusted_filters, intent_sort = apply_followup_intent(
                    intent=intent,
                    prev_filters=prev,
                    last_results=last_results,
                )
                merged = merge_filters(adjusted_filters, new_filters)
                if intent_sort:
                    sort_by = intent_sort
            else:
                merged = merge_filters(prev, new_filters)

            if low_message in {"show closest alternatives", "arată alternative apropiate", "arata alternative apropiate"}:
                alt_results = closest_alternatives(db, merged)
                save_session(payload.session_id, merged, alt_results)
                alt_message = (
                    "Closest alternatives available in the catalog right now:"
                    if language == "en"
                    else "Cele mai apropiate alternative disponibile în catalog acum:"
                )
                return ChatResponse(
                    assistant_message=alt_message,
                    filters=merged,
                    results=_serialize_products(alt_results),
                    clarifying_question=None,
                    quick_actions=None,
                )

            found = query_products(db, merged, sort_by=sort_by)
            effective_filters = merged
            assistant_message, clarifying_question = format_response(
                language,
                effective_filters,
                found,
                intent=intent,
            )

            if not found:
                no_results_message = format_no_results_message(language, effective_filters)
                return ChatResponse(
                    assistant_message=no_results_message,
                    filters=effective_filters,
                    results=[],
                    clarifying_question=None,
                    quick_actions=_no_results_actions(language=language, filters=effective_filters, db=db),
                )

            if found:
                save_session(payload.session_id, effective_filters, found)

            results = _serialize_products(found)

            return ChatResponse(
                assistant_message=assistant_message,
                filters=effective_filters,
                results=results,
                clarifying_question=clarifying_question,
                quick_actions=None,
            )
        except Exception:
            logger.exception("Rule-based chat failed")
            fallback = (
                "A apărut o eroare. Încearcă din nou cu buget și categorie (gaming/școală/creator/ultrabook)."
                if requested_language == "ro"
                else "An error occurred. Try again with budget and category (gaming/school/creator/ultrabook)."
            )
            return ChatResponse(
                assistant_message=fallback,
                filters=prev,
                results=[],
                clarifying_question=fallback,
                quick_actions=None,
            )

    if settings.local_bot_mode == "openai":
        from app.services.openai_chat import (  # local import to avoid OpenAI in rule_based mode
            OpenAIQuotaExceededError,
            OpenAIUpstreamError,
            extract_filters,
            generate_assistant_message,
        )

        user_language = requested_language

        try:
            extracted, clarifying_question, language = await extract_filters(
                message=payload.message,
                previous_filters=prev,
            )
        except OpenAIQuotaExceededError:
            logger.exception("OpenAI quota exceeded")
            raise HTTPException(
                status_code=402,
                detail="OpenAI quota exceeded / billing not active",
            )
        except OpenAIUpstreamError as exc:
            logger.exception("OpenAI upstream error")
            raise HTTPException(status_code=502, detail=str(exc))

        if language not in {"ro", "en"} or language != user_language:
            logger.warning(
                "Overriding extracted language to match user language",
                extra={"extracted_language": language, "user_language": user_language},
            )
            language = user_language

        merged = merge_filters(prev, extracted.model_dump(exclude_none=True))
        save_session(payload.session_id, merged, [])

        has_category = bool(merged.get("category"))
        has_budget = merged.get("min_price") is not None or merged.get("max_price") is not None

        results: list[dict] = []

        if clarifying_question or (not has_category) or (not has_budget):
            if not clarifying_question:
                clarifying_question = (
                    "Ce categorie te interesează (gaming/școală/creator/ultrabook) și ce buget ai?"
                    if language == "ro"
                    else "Which category (gaming/school/creator/ultrabook) and what budget do you have?"
                )

            assistant_message = clarifying_question
            return ChatResponse(
                assistant_message=assistant_message,
                filters=merged,
                results=results,
                clarifying_question=clarifying_question,
                quick_actions=None,
            )

        strict_results = query_products(db, merged, sort_by="price_asc")
        results = _serialize_products(strict_results)

        if not strict_results:
            return ChatResponse(
                assistant_message=format_no_results_message(language, merged),
                filters=merged,
                results=[],
                clarifying_question=None,
                quick_actions=_no_results_actions(language=language, filters=merged, db=db),
            )

        try:
            assistant_message = await generate_assistant_message(
                message=payload.message,
                language=language,
                filters=merged,
                results=results[:5],
            )

            assistant_language = detect_language(assistant_message)
            if assistant_language != language:
                logger.warning(
                    "Assistant reply language mismatch; regenerating once",
                    extra={"expected_language": language, "assistant_language": assistant_language},
                )
                assistant_message = await generate_assistant_message(
                    message=payload.message,
                    language=language,
                    filters=merged,
                    results=results[:5],
                )
        except OpenAIQuotaExceededError:
            logger.exception("OpenAI quota exceeded")
            raise HTTPException(
                status_code=402,
                detail="OpenAI quota exceeded / billing not active",
            )
        except OpenAIUpstreamError as exc:
            logger.exception("OpenAI upstream error")
            raise HTTPException(status_code=502, detail=str(exc))

        return ChatResponse(
            assistant_message=assistant_message,
            filters=merged,
            results=results[:5],
            clarifying_question=None,
            quick_actions=None,
        )

    raise HTTPException(status_code=500, detail="Invalid LOCAL_BOT_MODE")
