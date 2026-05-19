import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routes import router
from utils import load_model


settings = get_settings()

logging.basicConfig(level=getattr(logging, settings["log_level"], logging.INFO))
logger = logging.getLogger("matricare")

app = FastAPI(title="MatriCare Backend")
app.state.model = None
app.state.settings = settings

ALLOWED_ORIGINS = settings["cors_origins"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    app.state.model = load_model(settings["model_file"])
    if app.state.model is None:
        logger.warning("App started but model failed to load. Predictions will fail.")


app.include_router(router)
