from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import hashlib
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
import secrets
import smtplib
import ssl

from db import MongoUnavailableError, get_users_collection

# Construct absolute paths for model and users file
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BACKEND_DIR, "model.pkl")
USERS_FILE = os.path.join(BACKEND_DIR, "users.json")

# Global model variable
model = None

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
    user_id: str
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
        print(f"Error: Failed to write users file: {str(e)}", file=sys.stderr)


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _normalize_user_record(user_record: dict | str | None) -> dict:
    if isinstance(user_record, dict):
        password_hash = user_record.get("password_hash")
        if not isinstance(password_hash, str) or not password_hash:
            password_hash = user_record.get("password")

        history = user_record.get("history")
        if not isinstance(history, list):
            history = []

        return {
            "password_hash": password_hash if isinstance(password_hash, str) else "",
            "history": history,
        }

    if isinstance(user_record, str):
        return {"password_hash": user_record, "history": []}

    return {"password_hash": "", "history": []}


def _mongo_collection():
    try:
        return get_users_collection()
    except MongoUnavailableError as exc:
        print(f"Warning: MongoDB unavailable: {exc}", file=sys.stderr)
    except Exception as exc:
        print(f"Warning: Failed to access MongoDB: {exc}", file=sys.stderr)

    return None


def _read_user_from_mongo(user_id: str):
    collection = _mongo_collection()
    if collection is None:
        return None

    try:
        return collection.find_one({"email": user_id})
    except Exception as exc:
        print(f"Warning: Failed to read user from MongoDB: {exc}", file=sys.stderr)
        return None


def _write_user_to_mongo(
    user_id: str,
    password_hash: str | None = None,
    history: list | None = None,
    verified: bool | None = None,
    otp: str | None = None,
) -> bool:
    collection = _mongo_collection()
    if collection is None:
        return False

    try:
        set_fields: dict = {"email": user_id}
        if password_hash is not None:
            set_fields["password"] = password_hash
        if history is not None:
            set_fields["history"] = history
        if verified is not None:
            set_fields["verified"] = bool(verified)
        if otp is not None:
            set_fields["otp"] = otp

        update_doc = {"$set": set_fields, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}}

        collection.update_one({"email": user_id}, update_doc, upsert=True)
        return True
    except Exception as exc:
        print(f"Warning: Failed to write user to MongoDB: {exc}", file=sys.stderr)
        return False


def _sync_user_to_json(user_id: str, user_record: dict | str | None) -> None:
    users = _read_users()
    users[user_id] = _normalize_user_record(user_record)
    _write_users(users)


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

    message = f"Subject: Your MatriCare OTP\n\nYour verification code is: {otp}\nIt expires in a few minutes."  # minimal body

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
        return True
    except Exception as exc:
        print(f"Warning: Failed to send OTP email: {exc}", file=sys.stderr)
        return False

@app.get ('/')
def home():
    return {'massage': 'backend running'}


@app.post("/signup")
def signup(payload: AuthPayload):
    email = payload.user_id.strip().lower()
    password = payload.password.strip()

    if not email or not password:
        return {"success": False, "message": "User ID and password are required"}

    # Check MongoDB first
    mongo_user = _read_user_from_mongo(email)
    if mongo_user:
        return {"success": False, "message": "User already exists"}

    # Check JSON as fallback
    users = _read_users()
    if email in users:
        return {"success": False, "message": "User already exists"}

    password_hash = _hash_password(password)
    user_record = {"password_hash": password_hash, "history": []}

    users[email] = user_record
    _write_users(users)

    # Best-effort: write to Mongo too. Keep JSON as fallback.
    _write_user_to_mongo(email, password_hash, [])

    return {"success": True, "message": "Signup successful"}


@app.post("/login")
def login(payload: AuthPayload):
    user_id = payload.user_id.strip().lower()
    password = payload.password.strip()

    if not user_id or not password:
        return {"success": False, "message": "User ID and password are required"}

    mongo_user = _read_user_from_mongo(user_id)
    if mongo_user:
        mongo_user_record = _normalize_user_record(mongo_user)
        stored_hash = mongo_user_record.get("password_hash")
        if isinstance(stored_hash, str) and stored_hash == _hash_password(password):
            _sync_user_to_json(user_id, mongo_user_record)
            return {"success": True, "message": "Login successful", "user_id": user_id}

        return {"success": False, "message": "Invalid password"}

    users = _read_users()
    raw_user = users.get(user_id)
    if not raw_user:
        return {"success": False, "message": "User not found. Please sign up first"}

    user = _normalize_user_record(raw_user)

    # Support both current record format ({"password_hash": "..."}) and legacy plain hash string.
    stored_hash = user.get("password_hash")
    if not isinstance(stored_hash, str) or stored_hash != _hash_password(password):
        return {"success": False, "message": "Invalid password"}

    users[user_id] = user
    _write_users(users)

    # Best-effort backfill keeps MongoDB in sync during the staged migration.
    _write_user_to_mongo(user_id, stored_hash, user.get("history", []))

    return {"success": True, "message": "Login successful", "user_id": user_id}


@app.post("/verify-email")
def verify_email(payload: VerifyPayload):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()

    if not email or not otp:
        return {"success": False, "message": "Email and OTP are required"}

    users = _read_users()
    raw_user = users.get(email)

    # First check JSON store
    if raw_user:
        user = _normalize_user_record(raw_user)
        stored_otp = user.get("otp")
        if stored_otp and stored_otp == otp:
            user["verified"] = True
            user.pop("otp", None)
            users[email] = user
            _write_users(users)
            # mirror to Mongo
            _write_user_to_mongo(email, user.get("password_hash"), user.get("history", []), verified=True, otp=None)
            return {"success": True, "message": "Email verified"}
        return {"success": False, "message": "Invalid OTP"}

    # Fall back to Mongo
    mongo_user = _read_user_from_mongo(email)
    if mongo_user:
        muser = _normalize_user_record(mongo_user)
        stored_otp = muser.get("otp")
        if stored_otp and stored_otp == otp:
            # update Mongo
            _write_user_to_mongo(email, muser.get("password_hash"), muser.get("history", []), verified=True, otp=None)
            # sync back to JSON
            _sync_user_to_json(email, {**muser, "verified": True, "otp": None})
            return {"success": True, "message": "Email verified"}
        return {"success": False, "message": "Invalid OTP"}

    return {"success": False, "message": "User not found"}


@app.get("/history/{user_id}")
def user_history(user_id: str):
    normalized_user_id = user_id.strip().lower()
    users = _read_users()
    raw_user = users.get(normalized_user_id)
    if not raw_user:
        return {"success": False, "message": "User not found", "history": []}

    user = _normalize_user_record(raw_user)
    users[normalized_user_id] = user
    _write_users(users)

    history = user.get("history", [])
    history_sorted = sorted(
        history,
        key=lambda item: item.get("timestamp", ""),
        reverse=True,
    )
    return {"success": True, "history": history_sorted}

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
            users = _read_users()
            raw_user = users.get(user_id)
            if raw_user:
                user = _normalize_user_record(raw_user)
                history_entry = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "prediction": result,
                    "parameters": {name: float(data[name]) for name in required_features},
                }
                user["history"].append(history_entry)
                users[user_id] = user
                _write_users(users)

        return {"prediction": result}

    except Exception as e:
        print(f"Prediction error: {str(e)}", file=sys.stderr)
        return {"error": str(e)}
