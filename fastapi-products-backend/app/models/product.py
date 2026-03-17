from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cover_photo: Mapped[str] = mapped_column(String(2048), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    price: Mapped[float] = mapped_column(Float, nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    cpu: Mapped[str] = mapped_column(String(255), nullable=False)
    ram_gb: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_gb: Mapped[int] = mapped_column(Integer, nullable=False)
    gpu: Mapped[str] = mapped_column(String(255), nullable=False)
    screen_inches: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    battery_hours: Mapped[float] = mapped_column(Float, nullable=False)
    os: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resolution: Mapped[str] = mapped_column(String(50), nullable=False)
    refresh_hz: Mapped[int | None] = mapped_column(Integer, nullable=True)
