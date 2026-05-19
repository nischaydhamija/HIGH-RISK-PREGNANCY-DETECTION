import sys
from datetime import datetime, timezone

from fastapi import APIRouter, Request

from models import AuthPayload
from utils import append_prediction, get_history_payload, login_user, signup_user


router = APIRouter()


@router.get("/")
def home():
    return {"massage": "backend running"}


@router.post("/signup")
def signup(payload: AuthPayload):
    try:
        success, message, email = signup_user(payload)
        if not success:
            return {"success": False, "message": message}

        return {"success": True, "message": message, "email": email}
    except Exception:
        print("Signup error", file=sys.stderr)
        return {"success": False, "message": "Signup failed"}


@router.post("/login")
def login(payload: AuthPayload):
    try:
        success, message, user_id, history = login_user(payload)
        if not success:
            return {"success": False, "message": message}

        return {"success": True, "message": message, "user_id": user_id, "history": history}
    except Exception:
        print("Login error", file=sys.stderr)
        return {"success": False, "message": "Login failed"}


@router.get("/history/{user_id}")
def user_history(user_id: str):
    try:
        success, history = get_history_payload(user_id)
        if not success:
            return {"success": False, "message": "User not found", "history": []}

        return {"success": True, "history": history}
    except Exception:
        print("History error", file=sys.stderr)
        return {"success": False, "message": "Failed to load history", "history": []}


@router.post("/predict")
def predict(data: dict, request: Request):
    try:
        model = getattr(request.app.state, "model", None)
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
            append_prediction(user_id, prediction_data)

        return {"prediction": result}
    except Exception:
        print("Prediction error", file=sys.stderr)
        return {"error": "Prediction failed"}