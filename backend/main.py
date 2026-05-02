from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import hashlib
import json
import os
from pathlib import Path
from datetime import datetime, timezone

app = FastAPI()

MODEL_FILE = Path(__file__).with_name("random_forest_model.pkl")
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

model = joblib.load(MODEL_FILE)
USERS_FILE = Path(__file__).with_name("users.json")


class AuthPayload(BaseModel):
    user_id: str
    password: str


def _read_users() -> dict:
    if not USERS_FILE.exists():
        return {}
    try:
        with USERS_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _write_users(users: dict) -> None:
    with USERS_FILE.open("w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _normalize_user_record(user_record: dict | str | None) -> dict:
    if isinstance(user_record, dict):
        history = user_record.get("history")
        if not isinstance(history, list):
            user_record["history"] = []
        return user_record

    if isinstance(user_record, str):
        return {"password_hash": user_record, "history": []}

    return {"password_hash": "", "history": []}

@app.get ('/')
def home():
    return {'massage': 'backend running'}


@app.post("/signup")
def signup(payload: AuthPayload):
    user_id = payload.user_id.strip().lower()
    password = payload.password.strip()

    if not user_id or not password:
        return {"success": False, "message": "User ID and password are required"}

    users = _read_users()
    if user_id in users:
        return {"success": False, "message": "User already exists"}

    users[user_id] = {"password_hash": _hash_password(password), "history": []}
    _write_users(users)
    return {"success": True, "message": "Signup successful"}


@app.post("/login")
def login(payload: AuthPayload):
    user_id = payload.user_id.strip().lower()
    password = payload.password.strip()

    if not user_id or not password:
        return {"success": False, "message": "User ID and password are required"}

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

    return {"success": True, "message": "Login successful", "user_id": user_id}


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
        return {"error": str(e)}