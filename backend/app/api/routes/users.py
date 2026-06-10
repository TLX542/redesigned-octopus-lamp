from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.api.deps import get_admin_user, get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.user import UserRead


router = APIRouter()


@router.get("", response_model=list[UserRead])
def list_users(_: UserRead = Depends(get_admin_user), db: Session = Depends(get_db)) -> list[User]:
    return db.scalars(select(User).order_by(User.id)).all()


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: UserRead = Depends(get_current_user)) -> UserRead:
    return current_user