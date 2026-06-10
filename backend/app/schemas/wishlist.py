from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductRead


class WishlistItemCreate(BaseModel):
    product_id: int = Field(gt=0)

    model_config = ConfigDict(extra="forbid")


class WishlistItemRead(BaseModel):
    id: int
    product: ProductRead
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
