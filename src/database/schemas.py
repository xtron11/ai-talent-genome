from pydantic import BaseModel
from typing import Optional


class RegisterRequest(BaseModel):
    phone: str
    password: str


class RegisterResponse(BaseModel):
    success: bool
    message: str


class LoginRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[int] = None