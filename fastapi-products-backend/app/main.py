from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.routers.chat import router as chat_router
from app.routers.products import router as products_router

app = FastAPI(title=settings.app_name)

allowed_origins = settings.cors_origins_list or [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

static_dir = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(products_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
