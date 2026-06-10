from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_sales_manager_user
from app.db.models import DiscountNotification, Product, WishlistItem
from app.db.session import get_db
from app.schemas.product import (
    ProductDiscountApply,
    ProductDiscountResponse,
    ProductDiscountResult,
    ProductPriceUpdate,
    ProductRead,
)
from app.schemas.user import UserRead


router = APIRouter()
CENTS = Decimal("0.01")


def calculate_discounted_price(price: Decimal, discount_rate: Decimal) -> Decimal:
    discounted_price = price * (Decimal("100") - discount_rate) / Decimal("100")
    return max(discounted_price.quantize(CENTS, rounding=ROUND_HALF_UP), CENTS)


@router.get("", response_model=list[ProductRead])
def list_products(
    category_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[Product]:
    query = select(Product).options(selectinload(Product.reviews))
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    return db.scalars(query.order_by(Product.id)).all()


@router.patch("/discounts", response_model=ProductDiscountResponse)
def apply_product_discount(
    payload: ProductDiscountApply,
    _: UserRead = Depends(get_sales_manager_user),
    db: Session = Depends(get_db),
) -> ProductDiscountResponse:
    product_ids = list(dict.fromkeys(payload.product_ids))
    products = db.scalars(
        select(Product)
        .options(selectinload(Product.reviews))
        .where(Product.id.in_(product_ids))
    ).all()

    products_by_id = {product.id: product for product in products}
    missing_product_ids = [
        product_id for product_id in product_ids if product_id not in products_by_id
    ]
    if missing_product_ids:
        missing_ids = ", ".join(str(product_id) for product_id in missing_product_ids)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {missing_ids}",
        )

    updated_products = []
    discount_details_by_product_id = {}
    for product_id in product_ids:
        product = products_by_id[product_id]
        original_price = product.price
        discounted_price = calculate_discounted_price(original_price, payload.discount_rate)
        product.price = discounted_price
        discount_details_by_product_id[product_id] = {
            "product_name": product.name,
            "original_price": original_price,
            "discounted_price": discounted_price,
        }
        updated_products.append(
            ProductDiscountResult(
                product=ProductRead.model_validate(product),
                original_price=original_price,
                discounted_price=discounted_price,
                discount_rate=payload.discount_rate,
            )
        )

    wishlist_items = db.scalars(
        select(WishlistItem).where(WishlistItem.product_id.in_(product_ids))
    ).all()
    for wishlist_item in wishlist_items:
        discount_details = discount_details_by_product_id[wishlist_item.product_id]
        db.add(
            DiscountNotification(
                user_id=wishlist_item.user_id,
                product_id=wishlist_item.product_id,
                product_name=discount_details["product_name"],
                discount_rate=payload.discount_rate,
                original_price=discount_details["original_price"],
                discounted_price=discount_details["discounted_price"],
            )
        )

    db.commit()

    return ProductDiscountResponse(
        updated_products=updated_products,
        notification_count=len(wishlist_items),
    )


@router.patch("/{product_id}/price", response_model=ProductRead)
def update_product_price(
    product_id: int,
    payload: ProductPriceUpdate,
    _: UserRead = Depends(get_sales_manager_user),
    db: Session = Depends(get_db),
) -> Product:
    product = db.scalar(
        select(Product)
        .options(selectinload(Product.reviews))
        .where(Product.id == product_id)
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.price = payload.price
    db.commit()
    db.refresh(product)

    return product
