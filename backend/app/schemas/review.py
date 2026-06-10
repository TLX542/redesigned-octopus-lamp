from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ReviewStatus = Literal["pending", "approved", "rejected"]


class ProductReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)

    @field_validator("comment")
    @classmethod
    def strip_comment(cls, value: str) -> str:
        return value.strip()


class ProductReviewCreate(ProductReviewBase):
    model_config = ConfigDict(extra="forbid")


class ProductReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)

    model_config = ConfigDict(extra="forbid")

    @field_validator("comment")
    @classmethod
    def strip_comment(cls, value: str | None) -> str | None:
        if value is None:
            return value

        return value.strip()


class ProductReviewAdminUpdate(ProductReviewUpdate):
    status: ReviewStatus | None = None


class ProductReviewRead(ProductReviewBase):
    id: int
    product_id: int
    user_id: int
    user_full_name: str
    status: ReviewStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
