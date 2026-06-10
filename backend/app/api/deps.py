from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db
from app.schemas.user import UserRead


bearer_scheme = HTTPBearer(auto_error=False)


def _read_user_from_credentials(
    credentials: HTTPAuthorizationCredentials | None,
    db: Session,
) -> UserRead | None:
    if credentials is None:
        return None

    subject = decode_access_token(credentials.credentials)
    if subject is None:
        return None

    try:
        user_id = int(subject)
    except ValueError:
        return None

    user = db.get(User, user_id)
    if user is None:
        return None

    return UserRead.model_validate(user)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserRead:
    current_user = _read_user_from_credentials(credentials, db)
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return current_user


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserRead | None:
    return _read_user_from_credentials(credentials, db)


def require_roles(*allowed_roles: str) -> Callable[[UserRead], UserRead]:
    def dependency(current_user: UserRead = Depends(get_current_user)) -> UserRead:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return dependency


def get_admin_user(current_user: UserRead = Depends(get_current_user)) -> UserRead:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def get_sales_manager_user(
    current_user: UserRead = Depends(require_roles("sales_manager", "admin")),
) -> UserRead:
    return current_user


def get_product_manager_user(
    current_user: UserRead = Depends(require_roles("product_manager", "admin")),
) -> UserRead:
    return current_user


def get_staff_user(
    current_user: UserRead = Depends(require_roles("sales_manager", "product_manager", "admin")),
) -> UserRead:
    return current_user
