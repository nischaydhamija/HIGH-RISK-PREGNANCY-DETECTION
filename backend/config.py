from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent


def _load_environment() -> None:
    load_dotenv(BASE_DIR / ".env", override=False)
    load_dotenv(override=False)


_load_environment()


@lru_cache(maxsize=1)
def get_settings() -> dict:
    frontend_url = os.getenv("FRONTEND_URL", "").strip()
    cors_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    if frontend_url and frontend_url not in cors_origins:
        cors_origins.insert(0, frontend_url)

    if not cors_origins:
        cors_origins = ["*"]

    return {
        "backend_dir": BASE_DIR,
        "model_file": BASE_DIR / "model.pkl",
        "users_file": BASE_DIR / "users.json",
        "mongodb_uri": (os.getenv("MONGODB_URI", "").strip() or os.getenv("MONGO_URI", "").strip()),
        "secret_key": os.getenv("SECRET_KEY", "").strip(),
        "frontend_url": frontend_url,
        "cors_origins": cors_origins,
        "mongo_db_name": os.getenv("MONGO_DB_NAME", "matricare").strip() or "matricare",
        "log_level": os.getenv("LOG_LEVEL", "INFO").upper(),
    }