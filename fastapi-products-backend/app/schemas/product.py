from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    cover_photo: str
    title: str
    description: str

    price: float = Field(ge=0)
    brand: str
    cpu: str
    ram_gb: int = Field(ge=0)
    storage_gb: int = Field(ge=0)
    gpu: str
    screen_inches: float = Field(ge=0)
    weight_kg: float = Field(ge=0)
    battery_hours: float = Field(ge=0)
    os: str
    category: str
    resolution: str
    refresh_hz: int | None = Field(default=None, ge=1)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    cover_photo: str | None = None
    title: str | None = None
    description: str | None = None

    price: float | None = Field(default=None, ge=0)
    brand: str | None = None
    cpu: str | None = None
    ram_gb: int | None = Field(default=None, ge=0)
    storage_gb: int | None = Field(default=None, ge=0)
    gpu: str | None = None
    screen_inches: float | None = Field(default=None, ge=0)
    weight_kg: float | None = Field(default=None, ge=0)
    battery_hours: float | None = Field(default=None, ge=0)
    os: str | None = None
    category: str | None = None
    resolution: str | None = None
    refresh_hz: int | None = Field(default=None, ge=1)


class ProductOut(ProductBase):
    id: int

    model_config = {"from_attributes": True}
