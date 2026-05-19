import bcrypt
import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib

from config import get_settings
from db import MongoUnavailableError, get_users_collection


logger = logging.getLogger("matricare")


def load_model(model_file: Path) -> Any | None:
    try:
        if not model_file.exists():
            logger.warning("Model file not found at %s", model_file)
            return None

        return joblib.load(model_file)
    except Exception:
        logger.exception("Failed to load model from %s", model_file)
        return None


def _read_users() -> dict:
    users_file = get_settings()["users_file"]
    if not users_file.exists():
        return {}

    try:
        with users_file.open("r", encoding="utf-8") as file_handle:
            data = json.load(file_handle)
        return data if isinstance(data, dict) else {}
    except Exception:
        logger.exception("Failed to read users file")
        return {}


def _write_users(users: dict) -> None:
    users_file = get_settings()["users_file"]
    try:
        with users_file.open("w", encoding="utf-8") as file_handle:
            json.dump(users, file_handle, indent=2)
    except Exception:
        logger.exception("Failed to write users file")


def _json_safe_value(value: Any):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()

    if isinstance(value, dict):
        return {
            key: _json_safe_value(inner_value)
            for key, inner_value in value.items()
            if key != "_id"
        }

    if isinstance(value, list):
        return [_json_safe_value(item) for item in value]

    return value


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        if password_hash.startswith(("$2a$", "$2b$", "$2y$")):
            return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

        legacy_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
        return password_hash == legacy_hash
    except Exception:
        return False


def _normalize_user_record(user_record: dict | str | None) -> dict:
    if isinstance(user_record, dict):
        password_hash = user_record.get("password_hash")
        if not isinstance(password_hash, str) or not password_hash:
            password_hash = user_record.get("hashed_password")
        if not isinstance(password_hash, str) or not password_hash:
            password_hash = user_record.get("password")

        history = user_record.get("history")
        if not isinstance(history, list):
            history = []

        return {
            "email": str(user_record.get("email", "")).strip().lower(),
            "password_hash": password_hash if isinstance(password_hash, str) else "",
            "hashed_password": password_hash if isinstance(password_hash, str) else "",
            "history": history,
        }

    if isinstance(user_record, str):
        return {
            "email": "",
            "password_hash": user_record,
            "hashed_password": user_record,
            "history": [],
        }

    return {
        "email": "",
        "password_hash": "",
        "hashed_password": "",
        "history": [],
    }


def _sorted_history(history: list | None) -> list:
    if not isinstance(history, list):
        return []

    return sorted(
        history,
        key=lambda item: item.get("timestamp", "") if isinstance(item, dict) else "",
        reverse=True,
    )


def _merge_history_entries(*histories: list | None) -> list:
    merged: list = []
    seen: set[str] = set()

    for history in histories:
        if not isinstance(history, list):
            continue

        for entry in history:
            if not isinstance(entry, dict):
                continue

            fingerprint = json.dumps(entry, sort_keys=True, default=str)
            if fingerprint in seen:
                continue

            seen.add(fingerprint)
            merged.append(entry)

    return _sorted_history(merged)


def _mongo_collection():
    try:
        return get_users_collection()
    except MongoUnavailableError as exc:
        logger.warning("MongoDB unavailable: %s", exc)
    except Exception as exc:
        logger.warning("Failed to access MongoDB: %s", exc)

    return None


def _read_user_from_mongo(user_id: str):
    collection = _mongo_collection()
    if collection is None:
        return None

    try:
        return collection.find_one({"email": user_id})
    except Exception as exc:
        logger.warning("Failed to read user from MongoDB: %s", exc)
        return None


def _write_user_to_mongo(
    user_id: str,
    password_hash: str | None = None,
    history: list | None = None,
) -> bool:
    collection = _mongo_collection()
    if collection is None:
        return False

    try:
        set_fields: dict = {"email": user_id}
        if password_hash is not None:
            set_fields["password"] = password_hash
            set_fields["password_hash"] = password_hash
            set_fields["hashed_password"] = password_hash
        if history is not None:
            set_fields["history"] = history

        update_doc = {
            "$set": set_fields,
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        }

        collection.update_one({"email": user_id}, update_doc, upsert=True)
        return True
    except Exception as exc:
        logger.warning("Failed to write user to MongoDB: %s", exc)
        return False


def _sync_user_to_json(user_id: str, user_record: dict | str | None) -> None:
    users = _read_users()
    users[user_id] = _json_safe_value(_normalize_user_record(user_record))
    _write_users(users)


def _append_prediction_to_user_history(user_id: str, prediction_data: dict) -> None:
    collection = _mongo_collection()
    mongo_user = None

    if collection is not None:
        try:
            collection.update_one(
                {"email": user_id},
                {"$push": {"history": prediction_data}},
            )
            mongo_user = collection.find_one({"email": user_id})
        except Exception as exc:
            logger.warning("Failed to append prediction to MongoDB: %s", exc)

    users = _read_users()
    raw_user = users.get(user_id)
    if raw_user:
        user = _normalize_user_record(raw_user)
        user["history"].append(prediction_data)
        users[user_id] = user
        _write_users(users)
    elif mongo_user:
        _sync_user_to_json(user_id, mongo_user)


def _get_user_profile(user_id: str) -> dict | None:
    mongo_user = _read_user_from_mongo(user_id)
    users = _read_users()
    raw_user = users.get(user_id)

    if mongo_user:
        normalized_user = _normalize_user_record(mongo_user)
        json_user = _normalize_user_record(raw_user) if raw_user else {"password_hash": "", "history": []}
        merged_user = {
            "email": normalized_user.get("email") or user_id,
            "password_hash": normalized_user.get("password_hash") or json_user.get("password_hash", ""),
            "hashed_password": normalized_user.get("hashed_password") or json_user.get("hashed_password", ""),
            "history": _merge_history_entries(normalized_user.get("history", []), json_user.get("history", [])),
        }
        _sync_user_to_json(user_id, merged_user)
        return merged_user

    if raw_user:
        normalized_user = _normalize_user_record(raw_user)
        users[user_id] = normalized_user
        _write_users(users)
        return normalized_user

    return None


def _normalize_auth_email(payload) -> str:
    return (payload.email or payload.user_id or "").strip().lower()


def signup_user(payload) -> tuple[bool, str, str]:
    email = _normalize_auth_email(payload)
    password = payload.password.strip()

    if not email or not password:
        return False, "Email and password are required", email

    mongo_user = _read_user_from_mongo(email)
    if mongo_user:
        return False, "User already exists", email

    users = _read_users()
    if email in users:
        return False, "User already exists", email

    password_hash = _hash_password(password)
    user_record = {
        "email": email,
        "password_hash": password_hash,
        "hashed_password": password_hash,
        "history": [],
        "created_at": datetime.now(timezone.utc),
    }

    if _write_user_to_mongo(email, password_hash, []):
        _sync_user_to_json(email, user_record)
    else:
        users[email] = _json_safe_value(user_record)
        _write_users(users)

    return True, "Signup successful", email


def login_user(payload) -> tuple[bool, str, str, list]:
    user_id = _normalize_auth_email(payload)
    password = payload.password.strip()

    if not user_id or not password:
        return False, "Email and password are required", user_id, []

    mongo_user = _read_user_from_mongo(user_id)
    if mongo_user:
        mongo_user_record = _normalize_user_record(mongo_user)
        stored_hash = mongo_user_record.get("password_hash") or mongo_user_record.get("hashed_password")
        if isinstance(stored_hash, str) and _verify_password(password, stored_hash):
            json_user = _normalize_user_record(_read_users().get(user_id))
            merged_user = {
                "email": user_id,
                "password_hash": mongo_user_record.get("password_hash") or json_user.get("password_hash", ""),
                "hashed_password": mongo_user_record.get("hashed_password") or json_user.get("hashed_password", ""),
                "history": _merge_history_entries(mongo_user_record.get("history", []), json_user.get("history", [])),
            }
            _sync_user_to_json(user_id, merged_user)
            return True, "Login successful", user_id, merged_user["history"]

        return False, "Invalid password", user_id, []

    users = _read_users()
    raw_user = users.get(user_id)
    if not raw_user:
        return False, "User not found. Please sign up first", user_id, []

    user = _normalize_user_record(raw_user)
    stored_hash = user.get("password_hash") or user.get("hashed_password")
    if not isinstance(stored_hash, str) or not _verify_password(password, stored_hash):
        return False, "Invalid password", user_id, []

    users[user_id] = user
    _write_users(users)
    _write_user_to_mongo(user_id, stored_hash, user.get("history", []))

    return True, "Login successful", user_id, _sorted_history(user.get("history", []))


def get_history_payload(user_id: str) -> tuple[bool, list]:
    normalized_user_id = user_id.strip().lower()
    user = _get_user_profile(normalized_user_id)
    if not user:
        return False, []

    return True, _sorted_history(user.get("history", []))


def append_prediction(user_id: str, prediction_data: dict) -> None:
    _append_prediction_to_user_history(user_id, prediction_data)