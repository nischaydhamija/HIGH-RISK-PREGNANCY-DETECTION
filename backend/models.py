from pydantic import BaseModel


class AuthPayload(BaseModel):
    email: str | None = None
    user_id: str | None = None
    password: str