import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.product import Product


DATA_PATH = Path(__file__).resolve().parent / "laptops.seed.json"


def seed(db: Session) -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Seed data file not found: {DATA_PATH}. Create it with a JSON array of laptops."
        )

    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("Seed JSON must be a list/array of laptop objects")

    seed_keys: set[tuple[str, str]] = set()

    for item in payload:
        title = item.get("title")
        brand = item.get("brand")
        if not title or not brand:
            raise ValueError("Each item must include at least 'title' and 'brand'")

        cover_photo = str(item.get("cover_photo", ""))
        if not cover_photo:
            raise ValueError("Each item must include 'cover_photo'")

        seed_keys.add((title, brand))

        exists_stmt = select(Product).where(Product.title == title, Product.brand == brand)
        existing = db.scalars(exists_stmt).first()
        if existing:
            existing.cover_photo = cover_photo
            existing.description = item.get("description", "")
            existing.price = float(item["price"])
            existing.cpu = item["cpu"]
            existing.ram_gb = int(item["ram_gb"])
            existing.storage_gb = int(item["storage_gb"])
            existing.gpu = item["gpu"]
            existing.screen_inches = float(item["screen_inches"])
            existing.weight_kg = float(item["weight_kg"])
            existing.battery_hours = float(item["battery_hours"])
            existing.os = item["os"]
            existing.category = item["category"]
            existing.resolution = item["resolution"]
            existing.refresh_hz = (int(item["refresh_hz"]) if item.get("refresh_hz") is not None else None)
            db.add(existing)
            continue

        product = Product(
            cover_photo=cover_photo,
            title=title,
            description=item.get("description", ""),
            price=float(item["price"]),
            brand=brand,
            cpu=item["cpu"],
            ram_gb=int(item["ram_gb"]),
            storage_gb=int(item["storage_gb"]),
            gpu=item["gpu"],
            screen_inches=float(item["screen_inches"]),
            weight_kg=float(item["weight_kg"]),
            battery_hours=float(item["battery_hours"]),
            os=item["os"],
            category=item["category"],
            resolution=item["resolution"],
            refresh_hz=(int(item["refresh_hz"]) if item.get("refresh_hz") is not None else None),
        )
        db.add(product)

    for existing in db.scalars(select(Product)).all():
        if (existing.title, existing.brand) not in seed_keys:
            db.delete(existing)

    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
