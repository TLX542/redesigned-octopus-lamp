from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.models import DiscountNotification, Product
from app.db.session import get_db
from app.schemas.notification import DiscountNotificationRead
from app.schemas.user import UserRead


router = APIRouter()


@router.get("/discounts", response_model=list[DiscountNotificationRead])
def list_discount_notifications(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DiscountNotification]:
    return db.scalars(
        select(DiscountNotification)
        .options(selectinload(DiscountNotification.product).selectinload(Product.reviews))
        .where(DiscountNotification.user_id == current_user.id)
        .order_by(DiscountNotification.created_at.desc(), DiscountNotification.id.desc())
    ).all()


@router.patch("/discounts/read", response_model=list[DiscountNotificationRead])
def mark_discount_notifications_read(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DiscountNotification]:
    notifications = db.scalars(
        select(DiscountNotification)
        .options(selectinload(DiscountNotification.product).selectinload(Product.reviews))
        .where(DiscountNotification.user_id == current_user.id)
        .order_by(DiscountNotification.created_at.desc(), DiscountNotification.id.desc())
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return notifications
