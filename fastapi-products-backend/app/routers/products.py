from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.product import (
    create_product,
    delete_product,
    get_product,
    list_products,
    search_products,
    update_product,
)
from app.db.session import get_db
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductOut:
    product = create_product(db, payload)
    return product


@router.get("", response_model=list[ProductOut])
def list_(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> list[ProductOut]:
    return list_products(db, skip=skip, limit=limit)


@router.get("/search", response_model=list[ProductOut])
def search(
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
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    return search_products(
        db,
        q=q,
        brand=brand,
        category=category,
        os=os,
        min_price=min_price,
        max_price=max_price,
        min_ram_gb=min_ram_gb,
        min_storage_gb=min_storage_gb,
        min_screen_inches=min_screen_inches,
        max_weight_kg=max_weight_kg,
        gpu=gpu,
        refresh_hz=refresh_hz,
        skip=skip,
        limit=limit,
    )


@router.get("/{product_id}", response_model=ProductOut)
def get(product_id: int, db: Session = Depends(get_db)) -> ProductOut:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)) -> ProductOut:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return update_product(db, product=product, payload=payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(product_id: int, db: Session = Depends(get_db)) -> None:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    delete_product(db, product=product)
    return None
