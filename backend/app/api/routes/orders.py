from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_sales_manager_user
from app.db.models import Order
from app.db.session import get_db
from app.schemas.order import OrderRead
from app.schemas.user import UserRead


router = APIRouter()


def start_of_day(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=UTC)


def start_of_next_day(value: date) -> datetime:
    return start_of_day(value) + timedelta(days=1)


@router.get("/mine", response_model=list[OrderRead])
def list_my_orders(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Order]:
    return db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
    ).all()


@router.get("/invoices", response_model=list[OrderRead])
def list_sales_manager_invoices(
    start_date: date | None = None,
    end_date: date | None = None,
    _: UserRead = Depends(get_sales_manager_user),
    db: Session = Depends(get_db),
) -> list[Order]:
    if start_date is not None and end_date is not None and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )

    query = select(Order).options(selectinload(Order.items))
    if start_date is not None:
        query = query.where(Order.created_at >= start_of_day(start_date))
    if end_date is not None:
        query = query.where(Order.created_at < start_of_next_day(end_date))

    return db.scalars(query.order_by(Order.created_at.desc(), Order.id.desc())).all()
