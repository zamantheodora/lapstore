import json
import logging

from openai import AsyncOpenAI
from openai import APIConnectionError, APIError, APIStatusError, RateLimitError

from app.core.config import settings
from app.schemas.chat import ChatFilters

logger = logging.getLogger(__name__)


class OpenAIQuotaExceededError(Exception):
    pass


class OpenAIUpstreamError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


def _client() -> AsyncOpenAI:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not set")
    return AsyncOpenAI(api_key=settings.openai_api_key)


FILTERS_JSON_SCHEMA: dict = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "category": {
            "type": ["string", "null"],
            "enum": ["gaming", "school", "creator", "ultrabook", None],
        },
        "min_price": {"type": ["number", "null"], "minimum": 0},
        "max_price": {"type": ["number", "null"], "minimum": 0},
        "brand": {"type": ["string", "null"]},
        "ram_gb": {"type": ["integer", "null"], "minimum": 0},
        "storage_gb": {"type": ["integer", "null"], "minimum": 0},
        "gpu": {"type": ["string", "null"]},
        "screen_inches": {"type": ["number", "null"], "minimum": 0},
        "weight_kg": {"type": ["number", "null"], "minimum": 0},
        "battery_hours": {"type": ["number", "null"], "minimum": 0},
        "os": {"type": ["string", "null"]},
        "refresh_hz": {"type": ["integer", "null"], "minimum": 1},
        "clarifying_question": {"type": ["string", "null"]},
        "language": {"type": "string", "enum": ["ro", "en"]},
    },
    "required": [
        "category",
        "min_price",
        "max_price",
        "brand",
        "ram_gb",
        "storage_gb",
        "gpu",
        "screen_inches",
        "weight_kg",
        "battery_hours",
        "os",
        "refresh_hz",
        "clarifying_question",
        "language",
    ],
}


async def extract_filters(*, message: str, previous_filters: dict | None = None) -> tuple[ChatFilters, str | None, str]:
    client = _client()
    prev = previous_filters or {}

    system = (
        "You are an information extraction engine for a laptop store assistant. "
        "Return ONLY valid JSON that conforms to the provided JSON schema. "
        "Extract filters from the user's message. "
        "If the user message is vague or missing key details, set clarifying_question to ONE short question that asks for both budget and use-case. "
        "Detect language of the user message: 'ro' for Romanian, 'en' for English. "
        "Set language='ro' whenever the user message is Romanian (including Romanian without diacritics). "
        "Set language='en' only when the message is clearly English. "
        "Default to 'ro' if unclear."
    )

    user = (
        "User message:\n"
        f"{message}\n\n"
        "Previous filters (may be empty):\n"
        f"{json.dumps(prev, ensure_ascii=False)}\n"
    )

    try:
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": user,
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {"name": "LaptopFilters", "schema": FILTERS_JSON_SCHEMA, "strict": True},
            },
            temperature=0,
        )
    except RateLimitError as exc:
        logger.exception("OpenAI rate limit error")
        body = getattr(getattr(exc, "response", None), "json", lambda: None)()
        code = None
        if isinstance(body, dict):
            code = (body.get("error") or {}).get("code")
        if code == "insufficient_quota":
            raise OpenAIQuotaExceededError() from exc
        raise OpenAIUpstreamError(str(exc)) from exc
    except (APIConnectionError, APIStatusError, APIError) as exc:
        logger.exception("OpenAI API error")
        raise OpenAIUpstreamError(str(exc)) from exc

    content = resp.choices[0].message.content or "{}"
    data = json.loads(content)

    language = data.get("language") or "ro"
    clarifying_question = data.get("clarifying_question")

    filters = ChatFilters(
        category=data.get("category"),
        min_price=data.get("min_price"),
        max_price=data.get("max_price"),
        brand=data.get("brand"),
        ram_gb=data.get("ram_gb"),
        storage_gb=data.get("storage_gb"),
        gpu=data.get("gpu"),
        screen_inches=data.get("screen_inches"),
        weight_kg=data.get("weight_kg"),
        battery_hours=data.get("battery_hours"),
        os=data.get("os"),
        refresh_hz=data.get("refresh_hz"),
    )

    return filters, clarifying_question, language


async def generate_assistant_message(*, message: str, language: str, filters: dict, results: list[dict]) -> str:
    client = _client()
    target_language = "Romanian" if language == "ro" else "English"

    system = (
        "You are a helpful AI shopping assistant for a laptop store. "
        "Always respond in the user's language. "
        "Always answer in EXACTLY the same language as the user's message. "
        "If language='ro', respond only in Romanian. "
        "If language='en', respond only in English. "
        "Do not switch languages and do not mix Romanian and English in the same reply. "
        "Use ONLY the provided recommended_laptops from our catalog; do not invent products or specs. "
        "Output format must be: "
        "1) One short line: what you understood from the user request. "
        "2) Top 2-3 recommendations (or fewer if fewer are available), and for each include: Name, Price, key specs (CPU/RAM/SSD/GPU/Hz), and exactly two short bullet points for why it matches. "
        "3) If no products match, explain briefly why and suggest the closest alternatives from the provided results if any. "
        "Be concise and practical."
    )

    user = {
        "user_message": message,
        "language": language,
        "target_response_language": target_language,
        "filters": filters,
        "recommended_laptops": results,
    }

    try:
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
            ],
            temperature=0.6,
        )
    except RateLimitError as exc:
        logger.exception("OpenAI rate limit error")
        body = getattr(getattr(exc, "response", None), "json", lambda: None)()
        code = None
        if isinstance(body, dict):
            code = (body.get("error") or {}).get("code")
        if code == "insufficient_quota":
            raise OpenAIQuotaExceededError() from exc
        raise OpenAIUpstreamError(str(exc)) from exc
    except (APIConnectionError, APIStatusError, APIError) as exc:
        logger.exception("OpenAI API error")
        raise OpenAIUpstreamError(str(exc)) from exc

    return (resp.choices[0].message.content or "").strip()
