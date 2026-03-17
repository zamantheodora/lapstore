import re
from typing import Any
from datetime import datetime, timedelta
from typing import Dict

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.product import Product


SESSION_STATE: Dict[str, Dict[str, Any]] = {}
_SESSION_TTL = timedelta(minutes=30)


def _cleanup_expired_sessions(now: datetime | None = None) -> None:
    current = now or datetime.utcnow()
    expired = []
    for session_id, state in SESSION_STATE.items():
        updated_at = state.get("updated_at")
        if not isinstance(updated_at, datetime):
            expired.append(session_id)
            continue
        if current - updated_at > _SESSION_TTL:
            expired.append(session_id)

    for session_id in expired:
        SESSION_STATE.pop(session_id, None)


def merge_filters(prev: dict, new: dict) -> dict:
    merged = dict(prev or {})
    for k, v in (new or {}).items():
        if v is None:
            continue
        merged[k] = v
    return merged


def get_session_filters(session_id: str) -> dict:
    _cleanup_expired_sessions()
    state = SESSION_STATE.get(session_id)
    if not state:
        return {}
    filters = state.get("filters")
    return filters if isinstance(filters, dict) else {}


def get_session_last_results(session_id: str) -> list:
    _cleanup_expired_sessions()
    state = SESSION_STATE.get(session_id)
    if not state:
        return []
    last_results = state.get("last_results")
    return list(last_results) if isinstance(last_results, list) else []


def save_session(session_id: str, filters: dict, results: list) -> None:
    _cleanup_expired_sessions()
    SESSION_STATE[session_id] = {
        "filters": dict(filters or {}),
        "last_results": list(results or []),
        "updated_at": datetime.utcnow(),
    }


def detect_followup_intent(text: str, language: str) -> str | None:
    low = (text or "").lower()

    if language == "ro":
        cheaper = ["mai ieftin", "mai ieftine", "mai accesibil", "mai accesibile"]
        more_expensive = ["mai scump", "mai scumpe", "premium"]
        more_powerful = ["mai puternic", "mai performant", "mai bun", "mai rapida", "mai rapid"]
        lighter = ["mai usor", "mai ușor", "mai portabil", "mai usoara", "mai ușoară"]
        better_battery = ["baterie mai buna", "baterie mai bună", "mai multa baterie", "mai multă baterie", "tine mai mult", "ține mai mult"]
    else:
        cheaper = ["cheaper", "less expensive", "more affordable"]
        more_expensive = ["more expensive", "premium"]
        more_powerful = ["more powerful", "better performance", "faster"]
        lighter = ["lighter", "more portable"]
        better_battery = ["better battery", "longer battery life", "battery lasts longer"]

    if any(k in low for k in cheaper):
        return "cheaper"
    if any(k in low for k in more_expensive):
        return "more_expensive"
    if any(k in low for k in more_powerful):
        return "more_powerful"
    if any(k in low for k in lighter):
        return "lighter"
    if any(k in low for k in better_battery):
        return "better_battery"
    return None


def _round_to_nearest_50(value: float) -> float:
    return float(int((value + 25) // 50) * 50)


def apply_followup_intent(
    *,
    intent: str,
    prev_filters: dict,
    last_results: list[Product],
) -> tuple[dict, str | None]:
    filters = dict(prev_filters or {})
    sort_by: str | None = None

    prices = [float(getattr(p, "price", 0) or 0) for p in last_results]
    min_price_result = min(prices) if prices else None
    max_price_result = max(prices) if prices else None

    if intent == "cheaper":
        if filters.get("max_price") is not None:
            filters["max_price"] = _round_to_nearest_50(float(filters["max_price"]) * 0.85)
        elif min_price_result is not None and min_price_result > 0:
            filters["max_price"] = max(0.0, _round_to_nearest_50(min_price_result - 200))
        sort_by = "price_asc"

    elif intent == "more_expensive":
        if filters.get("max_price") is not None:
            filters["max_price"] = _round_to_nearest_50(float(filters["max_price"]) * 1.2)
        elif max_price_result is not None and max_price_result > 0:
            filters["min_price"] = max_price_result + 200
        sort_by = "price_desc"

    elif intent == "more_powerful":
        if filters.get("ram_gb") is None:
            filters["ram_gb"] = 16
        if filters.get("category") == "gaming" and filters.get("refresh_hz") is None:
            filters["refresh_hz"] = 144

    elif intent == "lighter":
        sort_by = "weight_asc"

    elif intent == "better_battery":
        sort_by = "battery_desc"

    return filters, sort_by


def detect_language(text: str) -> str:
    t = (text or "").strip().lower()
    padded = f" {t} "

    if any(ch in t for ch in ("ă", "â", "î", "ș", "ţ", "ț")):
        return "ro"

    ro_markers = (
        " vreau ",
        " recomand",
        " laptop pentru",
        " buget",
        " școal",
        " scoala",
        " facultate",
        " preț",
        " pret",
        " lei",
    )
    en_markers = (
        " i want ",
        " recommend",
        " laptop for",
        " budget",
        " school",
        " college",
        " price",
        " under ",
        " dollars",
        " usd",
        " ron",
        " is it",
        " good fit",
    )

    ro_score = sum(1 for marker in ro_markers if marker in padded)
    en_score = sum(1 for marker in en_markers if marker in padded)

    if en_score > ro_score:
        return "en"
    return "ro"


_BRANDS = [
    "lenovo",
    "asus",
    "hp",
    "dell",
    "msi",
    "apple",
    "acer",
]

_CATEGORY_MAP = {
    "gaming": "gaming",
    "joc": "gaming",
    "jocuri": "gaming",
    "school": "school",
    "scoala": "school",
    "școală": "school",
    "facultate": "school",
    "office": "school",
    "creator": "creator",
    "editare": "creator",
    "ultrabook": "ultrabook",
    "portabil": "ultrabook",
}


def extract_filters_rule_based(text: str) -> dict:
    t = (text or "").strip()
    low = t.lower()

    filters: dict[str, Any] = {}

    m = re.search(r"\b(?:sub|pana la|până la)\s*(\d{3,6})\b", low)
    if not m:
        m = re.search(r"\bunder\s*(\d{3,6})\b", low)
    if m:
        filters["max_price"] = float(m.group(1))

    ram_ctx = re.search(r"\b(?:ram|memorie|memory)\b", low)
    storage_ctx = re.search(r"\b(?:ssd|storage|stocare)\b", low)

    m = re.search(r"\b(\d{1,3})\s*gb\s*ram\b", low)
    if not m:
        m = re.search(r"\bram\s*(\d{1,3})\s*gb\b", low)
    if m:
        filters["ram_gb"] = int(m.group(1))
    else:
        m = re.search(r"\b(\d{1,3})\s*gb\b", low)
        if m:
            value = int(m.group(1))
            if ram_ctx and not storage_ctx:
                filters["ram_gb"] = value
            elif storage_ctx and not ram_ctx:
                filters["storage_gb"] = value
            else:
                filters["ram_gb"] = value

    m = re.search(r"\b(?:ssd|storage|stocare)\s*(\d{2,5})\s*gb\b", low)
    if m:
        filters["storage_gb"] = int(m.group(1))
    else:
        m = re.search(r"\b(?:ssd|storage|stocare)\s*(\d)\s*tb\b", low)
        if m:
            filters["storage_gb"] = int(m.group(1)) * 1000

    m = re.search(r"\b(\d{2,3})\s*hz\b", low)
    if m:
        filters["refresh_hz"] = int(m.group(1))

    for b in _BRANDS:
        if re.search(rf"\b{re.escape(b)}\b", low):
            filters["brand"] = b.upper() if b == "hp" else b.capitalize()
            break

    for key, mapped in _CATEGORY_MAP.items():
        if re.search(rf"\b{re.escape(key)}\b", low):
            filters["category"] = mapped
            break

    return filters


def query_products(db: Session, filters: dict, *, sort_by: str = "price_asc") -> list[Product]:
    clauses = []

    if filters.get("category"):
        clauses.append(Product.category == filters["category"])
    if filters.get("brand"):
        clauses.append(Product.brand == filters["brand"])
    if filters.get("max_price") is not None:
        clauses.append(Product.price <= float(filters["max_price"]))
    if filters.get("min_price") is not None:
        clauses.append(Product.price >= float(filters["min_price"]))
    if filters.get("ram_gb") is not None:
        clauses.append(Product.ram_gb >= int(filters["ram_gb"]))
    if filters.get("storage_gb") is not None:
        clauses.append(Product.storage_gb >= int(filters["storage_gb"]))
    if filters.get("refresh_hz") is not None:
        clauses.append(Product.refresh_hz == int(filters["refresh_hz"]))

    stmt = select(Product)
    if clauses:
        stmt = stmt.where(and_(*clauses))

    if sort_by == "price_desc":
        stmt = stmt.order_by(Product.price.desc())
    elif sort_by == "weight_asc":
        stmt = stmt.order_by(Product.weight_kg.asc())
    elif sort_by == "battery_desc":
        stmt = stmt.order_by(Product.battery_hours.desc())
    else:
        stmt = stmt.order_by(Product.price.asc())

    stmt = stmt.limit(3)
    return list(db.scalars(stmt).all())


def next_viable_budget(db: Session, filters: dict) -> float | None:
    if filters.get("max_price") is None:
        return None

    clauses = []
    if filters.get("category"):
        clauses.append(Product.category == filters["category"])
    if filters.get("brand"):
        clauses.append(Product.brand == filters["brand"])
    if filters.get("ram_gb") is not None:
        clauses.append(Product.ram_gb >= int(filters["ram_gb"]))
    if filters.get("storage_gb") is not None:
        clauses.append(Product.storage_gb >= int(filters["storage_gb"]))
    if filters.get("refresh_hz") is not None:
        clauses.append(Product.refresh_hz == int(filters["refresh_hz"]))

    max_price = float(filters["max_price"])
    clauses.append(Product.price > max_price)

    stmt = select(Product.price).where(and_(*clauses)).order_by(Product.price.asc()).limit(1)
    value = db.scalar(stmt)
    return float(value) if value is not None else None


def closest_alternatives(db: Session, filters: dict) -> list[Product]:
    relaxed = dict(filters or {})
    relaxed.pop("max_price", None)
    relaxed.pop("min_price", None)
    relaxed["min_price"] = 0
    return query_products(db, relaxed, sort_by="price_asc")


def format_no_results_message(language: str, filters: dict) -> str:
    category = str(filters.get("category") or "laptops").lower()
    budget = filters.get("max_price")

    if language == "en":
        if budget is not None and category == "gaming":
            return f"No gaming laptops under {int(float(budget))} RON in the catalog right now."
        if budget is not None:
            return f"No {category} laptops under {int(float(budget))} RON in the catalog right now."
        return "No laptops match your current filters in the catalog right now."

    if budget is not None and category == "gaming":
        return f"Nu avem laptopuri de gaming sub {int(float(budget))} RON în catalog acum."
    if budget is not None:
        return f"Nu avem laptopuri {category} sub {int(float(budget))} RON în catalog acum."
    return "Nu avem laptopuri care să se potrivească filtrelor tale în catalog acum."


def query_products_with_fallback(
    db: Session,
    filters: dict,
    *,
    sort_by: str = "price_asc",
) -> tuple[list[Product], dict, bool, str | None]:
    """Return (results, effective_filters, used_fallback, fallback_mode)."""

    base_filters = dict(filters or {})
    results = query_products(db, base_filters, sort_by=sort_by)
    if results or not base_filters:
        return results, base_filters, False, None

    # 1) Relax refresh_hz
    if "refresh_hz" in base_filters and base_filters.get("refresh_hz") is not None:
        relaxed = dict(base_filters)
        hz = int(relaxed["refresh_hz"])
        if hz == 144:
            relaxed["refresh_hz"] = 120
        elif hz >= 120:
            relaxed["refresh_hz"] = 60
        results = query_products(db, relaxed, sort_by=sort_by)
        if results:
            return results, relaxed, True, "relaxed_requirements"

    # 2) Relax RAM
    if base_filters.get("ram_gb") is not None and int(base_filters["ram_gb"]) >= 16:
        relaxed = dict(base_filters)
        relaxed["ram_gb"] = 8
        results = query_products(db, relaxed, sort_by=sort_by)
        if results:
            return results, relaxed, True, "relaxed_requirements"

    # 3) Remove category
    if base_filters.get("category"):
        relaxed = dict(base_filters)
        relaxed.pop("category", None)
        results = query_products(db, relaxed, sort_by=sort_by)
        if results:
            return results, relaxed, True, "relaxed_requirements"

    # 4) Closest above budget: remove max_price and search by ascending price
    if base_filters.get("max_price") is not None:
        relaxed = dict(base_filters)
        relaxed.pop("max_price", None)
        relaxed["min_price"] = 0
        results = query_products(db, relaxed, sort_by="price_asc")
        if results:
            return results, relaxed, True, "closest_above_budget"

    return [], base_filters, False, None


def format_response(
    language: str,
    filters: dict,
    results: list[Product],
    *,
    intent: str | None = None,
    relaxed: bool = False,
    fallback_mode: str | None = None,
) -> tuple[str, str | None]:
    if results:
        relaxed_prefix = None
        if relaxed and fallback_mode == "closest_above_budget":
            relaxed_prefix = (
                "Closest options slightly above your budget:"
                if language == "en"
                else "Cele mai apropiate opțiuni puțin peste buget:"
            )
        elif relaxed:
            relaxed_prefix = (
                "I couldn't find an exact match, so I slightly relaxed the requirements to find suitable alternatives."
                if language == "en"
                else "Nu am găsit rezultate exacte, am relaxat ușor cerințele pentru a găsi alternative potrivite."
            )

        if intent:
            if language == "en":
                prefix = "I adjusted the search to find "
                mapping = {
                    "cheaper": "a cheaper option",
                    "more_expensive": "a more expensive / premium option",
                    "more_powerful": "a more powerful option",
                    "lighter": "a lighter option",
                    "better_battery": "an option with better battery life",
                }
                note = prefix + mapping.get(intent, "a better match") + "."
            else:
                prefix = "Am ajustat căutarea pentru "
                mapping = {
                    "cheaper": "o variantă mai ieftină",
                    "more_expensive": "o variantă mai scumpă / premium",
                    "more_powerful": "o variantă mai puternică",
                    "lighter": "o variantă mai ușoară",
                    "better_battery": "o variantă cu baterie mai bună",
                }
                note = prefix + mapping.get(intent, "o potrivire mai bună") + "."

        if language == "en":
            intro = "Top picks based on what you asked for:"
            followup = "Quick question: what matters most—performance, portability, or battery life?"
        else:
            intro = "Top recomandări pe baza cerințelor tale:"
            followup = "Întrebare rapidă: ce contează cel mai mult—performanța, portabilitatea sau bateria?"

        lines = [intro]
        if relaxed_prefix:
            lines.insert(0, relaxed_prefix)
        if intent:
            lines.insert(0, note)

        for p in results[:3]:
            reasons = []
            if filters.get("category") == "gaming" or (p.category == "gaming"):
                if p.refresh_hz:
                    reasons.append(f"{p.refresh_hz}Hz")
                reasons.append(p.gpu)
            if filters.get("ram_gb") is not None:
                reasons.append(f"{p.ram_gb}GB RAM")
            if filters.get("storage_gb") is not None:
                reasons.append(f"{p.storage_gb}GB SSD")
            if len(reasons) < 2:
                reasons.append(f"~{p.battery_hours}h battery" if language == "en" else f"~{p.battery_hours}h baterie")

            r = ", ".join(reasons[:2])
            lines.append(f"- {p.title} ({p.brand}) — {int(p.price)} RON. Why: {r}" if language == "en" else f"- {p.title} ({p.brand}) — {int(p.price)} RON. Motive: {r}")

        lines.append(followup)
        return "\n".join(lines), followup

    if language == "en":
        question = "I couldn't find an exact match. What category do you want (gaming/school/creator/ultrabook) and what is your budget?"
        msg = "No results with the current filters. Try increasing the budget or lowering the requirements."
    else:
        question = "Nu am găsit un match exact. Ce categorie vrei (gaming/școală/creator/ultrabook) și ce buget ai?"
        msg = "Nu am găsit rezultate cu filtrele actuale. Încearcă să mărești bugetul sau să relaxezi cerințele."

    return msg, question
