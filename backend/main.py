from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt
import joblib
import hashlib
import json
import logging
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import secrets
import smtplib
import ssl

from db import MongoUnavailableError, get_users_collection


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger("matricare")

# Construct absolute paths for model and users file
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BACKEND_DIR, "model.pkl")
USERS_FILE = os.path.join(BACKEND_DIR, "users.json")

# Global model variable
model = None
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))

def load_model():
    """Load the ML model with error handling."""
    global model
    try:
        if not os.path.exists(MODEL_FILE):
            print(f"ERROR: Model file not found at {MODEL_FILE}", file=sys.stderr)
            print(f"Current backend directory: {BACKEND_DIR}", file=sys.stderr)
            print(f"Files in backend directory: {os.listdir(BACKEND_DIR)}", file=sys.stderr)
            return False
        
        model = joblib.load(MODEL_FILE)
        print(f"✓ Model loaded successfully from {MODEL_FILE}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to load model from {MODEL_FILE}: {str(e)}", file=sys.stderr)
        return False

app = FastAPI(title="MatriCare Backend")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load model on app startup."""
    success = load_model()
    if not success:
        print("WARNING: App started but model failed to load. Predictions will fail.", file=sys.stderr)


class AuthPayload(BaseModel):
    email: str | None = None
    user_id: str | None = None
    password: str


class VerifyPayload(BaseModel):
    email: str
    otp: str


def _read_users() -> dict:
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception as e:
        print(f"Warning: Failed to read users file: {str(e)}", file=sys.stderr)
        return {}


def _write_users(users: dict) -> None:
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        logger.error("Failed to write users file: %s", e)


def _json_safe_value(value):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()

    if isinstance(value, dict):
        return {key: _json_safe_value(inner_value) for key, inner_value in value.items() if key != "_id"}

    if isinstance(value, list):
        return [_json_safe_value(item) for item in value]

    return value


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _coerce_datetime(value):
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)

    if isinstance(value, str) and value:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None

    return None


def _otp_is_valid(user_record: dict, otp: str) -> bool:
    stored_otp = user_record.get("otp_code")
    if not isinstance(stored_otp, str) or stored_otp != otp:
        return False

    expiry = _coerce_datetime(user_record.get("otp_expiry"))
    if expiry is None:
        return False

    return expiry > datetime.now(timezone.utc)


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

        email_verified = user_record.get("email_verified")
        if email_verified is None:
            email_verified = user_record.get("verified", False)

        otp_code = user_record.get("otp_code")
        if not isinstance(otp_code, str) or not otp_code:
            otp_code = user_record.get("otp")

        otp_expiry = user_record.get("otp_expiry")
        if otp_expiry is None:
            otp_expiry = user_record.get("otp_expiration")

        return {
            "email": str(user_record.get("email", "")).strip().lower(),
            "password_hash": password_hash if isinstance(password_hash, str) else "",
            "hashed_password": password_hash if isinstance(password_hash, str) else "",
            "email_verified": bool(email_verified),
            "otp_code": otp_code if isinstance(otp_code, str) else None,
            "otp_expiry": otp_expiry,
            "history": history,
        }

    if isinstance(user_record, str):
        return {
            "email": "",
            "password_hash": user_record,
            "hashed_password": user_record,
            "email_verified": False,
            "otp_code": None,
            "otp_expiry": None,
            "history": [],
        }

    return {
        "email": "",
        "password_hash": "",
        "hashed_password": "",
        "email_verified": False,
        "otp_code": None,
        "otp_expiry": None,
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
    verified: bool | None = None,
    otp: str | None = None,
    otp_expiry: datetime | None = None,
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
        if verified is not None:
            set_fields["verified"] = bool(verified)
            set_fields["email_verified"] = bool(verified)
        if otp is not None:
            set_fields["otp"] = otp
            set_fields["otp_code"] = otp
        if otp_expiry is not None:
            set_fields["otp_expiry"] = otp_expiry

        update_doc = {"$set": set_fields, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}}

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
            "email_verified": bool(normalized_user.get("email_verified") or json_user.get("email_verified", False)),
            "otp_code": normalized_user.get("otp_code") or json_user.get("otp_code"),
            "otp_expiry": normalized_user.get("otp_expiry") or json_user.get("otp_expiry"),
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


def _send_otp_email(to_email: str, otp: str) -> bool:
    """Send a short OTP email using SMTP. Uses env vars and fails gracefully.

    Required env vars: EMAIL_USER, EMAIL_PASS. Optional: EMAIL_SMTP_SERVER, EMAIL_SMTP_PORT, EMAIL_FROM
    """
    smtp_server = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("EMAIL_SMTP_PORT", "465"))
    email_user = os.getenv("EMAIL_USER", "").strip()
    email_pass = os.getenv("EMAIL_PASS", "").strip()
    email_from = os.getenv("EMAIL_FROM", "").strip() or email_user

    if not email_user or not email_pass:
        print("Warning: EMAIL_USER or EMAIL_PASS not configured; skipping OTP send", file=sys.stderr)
        return False

    message = f"Subject: Your MatriCare verification code\n\nYour verification code is: {otp}"

    try:
        context = ssl.create_default_context()
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context) as server:
                server.login(email_user, email_pass)
                server.sendmail(email_from, to_email, message)
        else:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls(context=context)
                server.login(email_user, email_pass)
                server.sendmail(email_from, to_email, message)
        logger.info("OTP email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.warning("Failed to send OTP email to %s: %s", to_email, exc)
        return False


def _normalize_auth_email(payload: AuthPayload) -> str:
    return (payload.email or payload.user_id or "").strip().lower()


def _issue_otp_for_user(email: str, password_hash: str | None = None) -> tuple[str, datetime]:
    otp_code = _generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    _write_user_to_mongo(
        email,
        password_hash=password_hash,
        verified=False,
        otp=otp_code,
        otp_expiry=otp_expiry,
    )
    return otp_code, otp_expiry

@app.get ('/')
def home():
    return {'massage': 'backend running'}


@app.post("/signup")
def signup(payload: AuthPayload):
    email = _normalize_auth_email(payload)
    password = payload.password.strip()

    if not email or not password:
        return {"success": False, "message": "Email and password are required"}

    mongo_user = _read_user_from_mongo(email)
    if mongo_user:
        normalized_user = _normalize_user_record(mongo_user)
        if normalized_user.get("email_verified"):
            logger.info("Signup rejected for verified user: %s", email)
            return {"success": False, "message": "User already exists"}

        otp_code, otp_expiry = _issue_otp_for_user(email, normalized_user.get("password_hash") or normalized_user.get("hashed_password"))
        _sync_user_to_json(
            email,
            {
                **normalized_user,
                "email": email,
                "email_verified": False,
                "otp_code": otp_code,
                "otp_expiry": otp_expiry,
            },
        )
        _send_otp_email(email, otp_code)
        logger.info("OTP resent during signup for unverified user: %s", email)
        return {"success": True, "message": "OTP resent", "email": email}

    users = _read_users()
    raw_user = users.get(email)
    if raw_user:
        normalized_user = _normalize_user_record(raw_user)
        if normalized_user.get("email_verified"):
            logger.info("Signup rejected for verified JSON user: %s", email)
            return {"success": False, "message": "User already exists"}

        otp_code, otp_expiry = _issue_otp_for_user(email, normalized_user.get("password_hash") or normalized_user.get("hashed_password"))
        updated_user = {
            **normalized_user,
            "email": email,
            "email_verified": False,
            "otp_code": otp_code,
            "otp_expiry": otp_expiry,
        }
        users[email] = _json_safe_value(updated_user)
        _write_users(users)
        _send_otp_email(email, otp_code)
        logger.info("OTP resent during signup for unverified JSON user: %s", email)
        return {"success": True, "message": "OTP resent", "email": email}

    password_hash = _hash_password(password)
    otp_code = _generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    user_record = {
        "email": email,
        "password_hash": password_hash,
        "hashed_password": password_hash,
        "email_verified": False,
        "otp_code": otp_code,
        "otp_expiry": otp_expiry,
        "history": [],
        "created_at": datetime.now(timezone.utc),
    }

    if _write_user_to_mongo(email, password_hash, [], verified=False, otp=otp_code, otp_expiry=otp_expiry):
        _sync_user_to_json(email, user_record)
    else:
        users[email] = _json_safe_value(user_record)
        _write_users(users)

    _send_otp_email(email, otp_code)
    logger.info("New user created and OTP sent: %s", email)
    return {"success": True, "message": "OTP sent", "email": email}


@app.post("/login")
def login(payload: AuthPayload):
    user_id = _normalize_auth_email(payload)
    password = payload.password.strip()

    if not user_id or not password:
        return {"success": False, "message": "Email and password are required"}

    mongo_user = _read_user_from_mongo(user_id)
    if mongo_user:
        mongo_user_record = _normalize_user_record(mongo_user)
        stored_hash = mongo_user_record.get("password_hash") or mongo_user_record.get("hashed_password")
        if isinstance(stored_hash, str) and _verify_password(password, stored_hash):
            if not mongo_user_record.get("email_verified"):
                logger.info("Login blocked for unverified user: %s", user_id)
                return {"success": False, "message": "Please verify your email"}

            json_user = _normalize_user_record(_read_users().get(user_id))
            merged_user = {
                "email": user_id,
                "password_hash": mongo_user_record.get("password_hash") or json_user.get("password_hash", ""),
                "hashed_password": mongo_user_record.get("hashed_password") or json_user.get("hashed_password", ""),
                "email_verified": bool(mongo_user_record.get("email_verified") or json_user.get("email_verified", False)),
                "otp_code": mongo_user_record.get("otp_code") or json_user.get("otp_code"),
                "otp_expiry": mongo_user_record.get("otp_expiry") or json_user.get("otp_expiry"),
                "history": _merge_history_entries(mongo_user_record.get("history", []), json_user.get("history", [])),
            }
            _sync_user_to_json(user_id, merged_user)
            return {
                "success": True,
                "message": "Login successful",
                "user_id": user_id,
                "email_verified": True,
                "history": merged_user["history"],
            }

        return {"success": False, "message": "Invalid password"}

    users = _read_users()
    raw_user = users.get(user_id)
    if not raw_user:
        return {"success": False, "message": "User not found. Please sign up first"}

    user = _normalize_user_record(raw_user)

    stored_hash = user.get("password_hash") or user.get("hashed_password")
    if not isinstance(stored_hash, str) or not _verify_password(password, stored_hash):
        return {"success": False, "message": "Invalid password"}

    if not user.get("email_verified"):
        logger.info("Login blocked for unverified JSON user: %s", user_id)
        return {"success": False, "message": "Please verify your email"}

    users[user_id] = user
    _write_users(users)

    _write_user_to_mongo(user_id, stored_hash, user.get("history", []), verified=True)

    return {
        "success": True,
        "message": "Login successful",
        "user_id": user_id,
        "email_verified": True,
        "history": _sorted_history(user.get("history", [])),
    }


@app.post("/verify-email")
def verify_email(payload: VerifyPayload):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()

    if not email or not otp:
        return {"success": False, "message": "Email and OTP are required"}

    mongo_user = _read_user_from_mongo(email)
    if mongo_user:
        muser = _normalize_user_record(mongo_user)
        if _otp_is_valid(muser, otp):
            collection = _mongo_collection()
            if collection is not None:
                collection.update_one(
                    {"email": email},
                    {
                        "$set": {"email_verified": True, "verified": True},
                        "$unset": {"otp_code": "", "otp_expiry": "", "otp": ""},
                    },
                )
            _sync_user_to_json(
                email,
                {
                    **muser,
                    "email": email,
                    "email_verified": True,
                    "otp_code": None,
                    "otp_expiry": None,
                },
            )
            logger.info("Email verified: %s", email)
            return {"success": True, "message": "Email verified"}
        logger.info("Invalid or expired OTP for %s", email)
        return {"success": False, "message": "Invalid or expired OTP"}

    users = _read_users()
    raw_user = users.get(email)
    if raw_user:
        user = _normalize_user_record(raw_user)
        if _otp_is_valid(user, otp):
            user["email_verified"] = True
            user.pop("otp_code", None)
            user.pop("otp_expiry", None)
            users[email] = _json_safe_value(user)
            _write_users(users)
            _write_user_to_mongo(email, user.get("password_hash") or user.get("hashed_password"), user.get("history", []), verified=True)
            logger.info("Email verified from JSON fallback: %s", email)
            return {"success": True, "message": "Email verified"}
        logger.info("Invalid or expired OTP for JSON fallback user %s", email)
        return {"success": False, "message": "Invalid or expired OTP"}

    return {"success": False, "message": "User not found"}


@app.get("/history/{user_id}")
def user_history(user_id: str):
    normalized_user_id = user_id.strip().lower()
    user = _get_user_profile(normalized_user_id)
    if not user:
        return {"success": False, "message": "User not found", "history": []}

    return {"success": True, "history": _sorted_history(user.get("history", []))}

@app.post("/predict")
def predict(data: dict):
    try:
        if model is None:
            return {"error": "Model is not loaded. Please check server logs."}
        
        required_features = list(getattr(model, "feature_names_in_", [
            "Age", "G", "P", "L", "A", "D", "SystolicBP", "DiastolicBP",
            "RBS", "BodyTemp", "HeartRate", "HB", "HBA1C", "RR"
        ]))

        missing = [name for name in required_features if name not in data]
        if missing:
            return {"error": f"Missing required fields: {', '.join(missing)}"}

        input_array = [[float(data[name]) for name in required_features]]

        prediction = model.predict(input_array)

        result = "No Risk" if prediction[0] == 0 else "High Risk"

        user_id_raw = data.get("user_id")
        user_id = str(user_id_raw).strip().lower() if user_id_raw is not None else ""

        if user_id:
            prediction_data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "prediction": result,
                "parameters": {name: float(data[name]) for name in required_features},
            }
            _append_prediction_to_user_history(user_id, prediction_data)

        return {"prediction": result}

    except Exception as e:
        print(f"Prediction error: {str(e)}", file=sys.stderr)
        return {"error": str(e)}
