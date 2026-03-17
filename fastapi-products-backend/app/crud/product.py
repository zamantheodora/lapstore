from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(
        cover_photo=str(payload.cover_photo),
        title=payload.title,
        description=payload.description,

        price=payload.price,
        brand=payload.brand,
        cpu=payload.cpu,
        ram_gb=payload.ram_gb,
        storage_gb=payload.storage_gb,
        gpu=payload.gpu,
        screen_inches=payload.screen_inches,
        weight_kg=payload.weight_kg,
        battery_hours=payload.battery_hours,
        os=payload.os,
        category=payload.category,
        resolution=payload.resolution,
        refresh_hz=payload.refresh_hz,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def list_products(db: Session, *, skip: int = 0, limit: int = 100) -> list[Product]:
    stmt = select(Product).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def update_product(db: Session, *, product: Product, payload: ProductUpdate) -> Product:
    data = payload.model_dump(exclude_unset=True)

    if "cover_photo" in data and data["cover_photo"] is not None:
        product.cover_photo = str(data["cover_photo"])
    if "title" in data and data["title"] is not None:
        product.title = data["title"]
    if "description" in data and data["description"] is not None:
        product.description = data["description"]

    if "price" in data and data["price"] is not None:
        product.price = data["price"]
    if "brand" in data and data["brand"] is not None:
        product.brand = data["brand"]
    if "cpu" in data and data["cpu"] is not None:
        product.cpu = data["cpu"]
    if "ram_gb" in data and data["ram_gb"] is not None:
        product.ram_gb = data["ram_gb"]
    if "storage_gb" in data and data["storage_gb"] is not None:
        product.storage_gb = data["storage_gb"]
    if "gpu" in data and data["gpu"] is not None:
        product.gpu = data["gpu"]
    if "screen_inches" in data and data["screen_inches"] is not None:
        product.screen_inches = data["screen_inches"]
    if "weight_kg" in data and data["weight_kg"] is not None:
        product.weight_kg = data["weight_kg"]
    if "battery_hours" in data and data["battery_hours"] is not None:
        product.battery_hours = data["battery_hours"]
    if "os" in data and data["os"] is not None:
        product.os = data["os"]
    if "category" in data and data["category"] is not None:
        product.category = data["category"]
    if "resolution" in data and data["resolution"] is not None:
        product.resolution = data["resolution"]
    if "refresh_hz" in data:
        product.refresh_hz = data["refresh_hz"]

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, *, product: Product) -> None:
    db.delete(product)
    db.commit()


def search_products(
    db: Session,
    *,
    q: str | None = None,
    brand: str | None = None,
    category: str | None = None,
    os: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_ram_gb: int | None = None,
    min_storage_gb: int | None = None,
    min_screen_inches: float | None = None,
    max_weight_kg: float | None = None,
    gpu: str | None = None,
    refresh_hz: int | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Product]:
    filters = []

    if q:
        like = f"%{q}%"
        filters.append((Product.title.like(like)) | (Product.description.like(like)))
    if brand:
        filters.append(Product.brand == brand)
    if category:
        filters.append(Product.category == category)
    if os:
        filters.append(Product.os == os)
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if min_ram_gb is not None:
        filters.append(Product.ram_gb >= min_ram_gb)
    if min_storage_gb is not None:
        filters.append(Product.storage_gb >= min_storage_gb)
    if min_screen_inches is not None:
        filters.append(Product.screen_inches >= min_screen_inches)
    if max_weight_kg is not None:
        filters.append(Product.weight_kg <= max_weight_kg)
    if gpu:
        filters.append(Product.gpu == gpu)
    if refresh_hz is not None:
        filters.append(Product.refresh_hz == refresh_hz)

    stmt = select(Product)
    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())
