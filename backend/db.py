import os
from functools import lru_cache

from pymongo import MongoClient


class MongoUnavailableError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_mongo_client() -> MongoClient:
    mongo_uri = os.getenv("MONGO_URI", "").strip()
    if not mongo_uri:
        raise MongoUnavailableError("MONGO_URI is not configured")

    try:
        return MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            socketTimeoutMS=3000,
        )
    except Exception as exc:
        raise MongoUnavailableError(f"Failed to create MongoDB client: {exc}") from exc


def get_users_collection():
    db_name = os.getenv("MONGO_DB_NAME", "matricare").strip() or "matricare"
    client = get_mongo_client()
    return client[db_name]["users"]