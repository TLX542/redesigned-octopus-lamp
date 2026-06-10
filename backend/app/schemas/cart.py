from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CartItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class CartAddItem(BaseModel):
    product_id: int
    quantity: int = 1


class CartRead(BaseModel):
    id: int
    user_id: int | None = None
    items: list[CartItemRead]
    total_amount: Decimal

    model_config = ConfigDict(from_attributes=True)


class CheckoutInvoiceItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CheckoutInvoiceRead(BaseModel):
    order_id: str
    db_order_id: int
    customer_name: str
    customer_email: str
    status: str
    created_at: str
    item_count: int
    total_amount: Decimal
    items: list[CheckoutInvoiceItem]
