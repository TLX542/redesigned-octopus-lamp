from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.db.models import Category
from app.db.session import get_db
from app.schemas.category import CategoryRead


router = APIRouter()


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return db.scalars(select(Category).order_by(Category.id)).all()
