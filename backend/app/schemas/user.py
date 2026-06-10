from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal["customer", "sales_manager", "product_manager", "admin"]


class UserBase(BaseModel):
    full_name: str
    email: EmailStr


class UserRegister(UserBase):
    password: str = Field(min_length=8)


class UserRead(UserBase):
    id: int
    role: UserRole = "customer"

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None

    model_config = ConfigDict(extra="forbid")