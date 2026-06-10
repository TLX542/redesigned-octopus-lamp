from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_router import api_router
from app.core.config import settings
from app.db.seed import init_database, seed_database
from app.db.session import SessionLocal


app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
def startup_event() -> None:
    init_database()
    with SessionLocal() as db:
        seed_database(db)


@app.get("/", tags=["root"])
def read_root() -> dict[str, str]:
    return {
        "message": "CS308 Online Store API is running. Open /docs for API docs or use the frontend on port 5173.",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
