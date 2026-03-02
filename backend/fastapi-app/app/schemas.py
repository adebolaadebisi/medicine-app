from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DoctorOut(BaseModel):
    id: int
    name: str
    specialty: str
    location: str | None = None
    experience_years: int | None = None
    bio: str | None = None

    model_config = {"from_attributes": True}


class FoodCheckCreate(BaseModel):
    name: str
    expiry: str
    status: str
    message: str
    days_until_expiry: int


class FoodCheckOut(FoodCheckCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MealPlanCreate(BaseModel):
    plan_type: str = "daily"
    condition: str
    goal: str | None = None
    activity: str | None = None
    data: dict


class MealPlanOut(BaseModel):
    id: int
    user_id: int
    plan_type: str
    condition: str
    goal: str | None
    activity: str | None
    data: dict
    created_at: datetime

