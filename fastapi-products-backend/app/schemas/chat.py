from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    session_id: str = Field(min_length=1)
    language: Literal["ro", "en"] | None = None


class ChatFilters(BaseModel):
    category: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    brand: str | None = None
    ram_gb: int | None = Field(default=None, ge=0)
    storage_gb: int | None = Field(default=None, ge=0)
    gpu: str | None = None
    screen_inches: float | None = Field(default=None, ge=0)
    weight_kg: float | None = Field(default=None, ge=0)
    battery_hours: float | None = Field(default=None, ge=0)
    os: str | None = None
    refresh_hz: int | None = Field(default=None, ge=1)


class ChatResponse(BaseModel):
    assistant_message: str
    filters: dict
    results: list[dict]
    clarifying_question: str | None = None
    quick_actions: list[dict] | None = None
