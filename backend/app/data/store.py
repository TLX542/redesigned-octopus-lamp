from decimal import Decimal

from pydantic import EmailStr

from app.core.security import hash_password
from app.schemas.cart import CartRead
from app.schemas.category import CategoryRead
from app.schemas.product import ProductRead
from app.schemas.user import UserRead


class UserAuthRecord(UserRead):
    hashed_password: str


USERS: list[UserRead] = [
    UserRead(id=1, full_name="Demo Customer", email="customer@example.com", role="customer"),
]

USER_AUTH_RECORDS: list[UserAuthRecord] = [
    UserAuthRecord(
        id=1,
        full_name="Demo Customer",
        email="customer@example.com",
        role="customer",
        hashed_password=hash_password("password123"),
    ),
]

CATEGORIES: list[CategoryRead] = [
    CategoryRead(id=1, name="Woody", description="Deep woods, amber, and aromatic blends"),
    CategoryRead(id=2, name="Fresh", description="Citrus, marine, and everyday fragrances"),
    CategoryRead(id=3, name="Warm", description="Spiced, smoky, and evening scents"),
    CategoryRead(id=4, name="Gift Sets", description="Ready-to-gift fragrance selections"),
]

PRODUCTS: list[ProductRead] = [
    ProductRead(
        id=1,
        name="Bleu de Chanel",
        model="100 ml / 3.38 fl. oz.",
        serial_number="FRAG-BDC-100",
        description=(
            "Bleu de Chanel is a woody, spicy fragrance for everyday wear and evening occasions."
        ),
        quantity_in_stock=8,
        price=Decimal("210.00"),
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=1,
    ),
    ProductRead(
        id=2,
        name="Dior Sauvage",
        model="100 ml / 3.38 fl. oz.",
        serial_number="FRAG-DSG-100",
        description="Dior Sauvage is a fresh, spicy fragrance built around bergamot and amberwood.",
        quantity_in_stock=10,
        price=Decimal("165.00"),
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=2,
    ),
    ProductRead(
        id=3,
        name="Tom Ford Noir Extreme",
        model="50 ml / 1.7 fl. oz.",
        serial_number="FRAG-TFNE-050",
        description="Tom Ford Noir Extreme is a warm, spicy scent with amber and vanilla notes.",
        quantity_in_stock=5,
        price=Decimal("195.00"),
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=3,
    ),
    ProductRead(
        id=4,
        name="Discovery Gift Set",
        model="5 x 10 ml / 0.34 fl. oz.",
        serial_number="FRAG-GIFT-SET",
        description="A curated discovery set for trying multiple signature scents before choosing a bottle.",
        quantity_in_stock=14,
        price=Decimal("89.00"),
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=4,
    ),
]

CARTS: dict[int, CartRead] = {}


def find_user_by_email(email: str | EmailStr) -> UserRead | None:
    target_email = str(email).lower()
    return next((user for user in USERS if user.email.lower() == target_email), None)


def find_user_auth_by_email(email: str | EmailStr) -> UserAuthRecord | None:
    target_email = str(email).lower()
    return next((user for user in USER_AUTH_RECORDS if user.email.lower() == target_email), None)


def add_user(full_name: str, email: str, role: str, hashed_password: str) -> UserRead:
    user = UserRead(id=len(USERS) + 1, full_name=full_name, email=email, role=role)
    auth_record = UserAuthRecord(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        hashed_password=hashed_password,
    )
    USERS.append(user)
    USER_AUTH_RECORDS.append(auth_record)
    return user
