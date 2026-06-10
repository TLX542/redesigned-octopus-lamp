from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import get_current_user
from app.db.models import Product, WishlistItem
from app.db.session import get_db
from app.schemas.user import UserRead
from app.schemas.wishlist import WishlistItemCreate, WishlistItemRead


router = APIRouter()


@router.get("", response_model=list[WishlistItemRead])
def list_wishlist_items(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[WishlistItem]:
    return db.scalars(
        select(WishlistItem)
        .options(selectinload(WishlistItem.product).selectinload(Product.reviews))
        .where(WishlistItem.user_id == current_user.id)
        .order_by(WishlistItem.created_at.desc(), WishlistItem.id.desc())
    ).all()


@router.post("/items", response_model=WishlistItemRead, status_code=status.HTTP_201_CREATED)
def add_wishlist_item(
    payload: WishlistItemCreate,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistItem:
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    existing_item = db.scalar(
        select(WishlistItem)
        .options(selectinload(WishlistItem.product).selectinload(Product.reviews))
        .where(
            WishlistItem.user_id == current_user.id,
            WishlistItem.product_id == payload.product_id,
        )
    )
    if existing_item is not None:
        return existing_item

    wishlist_item = WishlistItem(
        user_id=current_user.id,
        product_id=payload.product_id,
    )
    db.add(wishlist_item)
    db.commit()

    return db.scalar(
        select(WishlistItem)
        .options(selectinload(WishlistItem.product).selectinload(Product.reviews))
        .where(WishlistItem.id == wishlist_item.id)
    )


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_wishlist_item(
    product_id: int,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    wishlist_item = db.scalar(
        select(WishlistItem).where(
            WishlistItem.user_id == current_user.id,
            WishlistItem.product_id == product_id,
        )
    )
    if wishlist_item is not None:
        db.delete(wishlist_item)
        db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
