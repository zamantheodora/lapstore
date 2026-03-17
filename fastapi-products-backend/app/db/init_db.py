from app.db.session import engine
from app.models.product import Product  # noqa: F401
from app.db.base import Base


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
