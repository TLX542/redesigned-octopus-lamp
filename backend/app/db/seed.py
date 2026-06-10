from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import Cart, Category, Product, User
from app.db.session import engine


def init_database() -> None:
    Base.metadata.create_all(bind=engine)


def ensure_user(
    db: Session,
    *,
    full_name: str,
    email: str,
    role: str,
    password: str,
) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is not None:
        return user

    user = User(
        full_name=full_name,
        email=email.lower(),
        role=role,
        hashed_password=hash_password(password),
    )
    db.add(user)
    db.flush()
    return user


def ensure_category(db: Session, *, category_id: int, name: str, description: str) -> Category:
    category = db.get(Category, category_id)
    if category is not None:
        return category

    category = Category(id=category_id, name=name, description=description)
    db.add(category)
    db.flush()
    return category


def ensure_product(
    db: Session,
    *,
    product_id: int,
    name: str,
    model: str,
    serial_number: str,
    description: str,
    quantity_in_stock: int,
    price: str,
    warranty_status: str,
    distributor_info: str,
    category_id: int,
) -> Product:
    product = db.get(Product, product_id)
    if product is not None:
        return product

    product = Product(
        id=product_id,
        name=name,
        model=model,
        serial_number=serial_number,
        description=description,
        quantity_in_stock=quantity_in_stock,
        price=Decimal(price),
        warranty_status=warranty_status,
        distributor_info=distributor_info,
        category_id=category_id,
    )
    db.add(product)
    db.flush()
    return product


def ensure_cart(db: Session, *, cart_id: int, user_id: int | None = None) -> Cart:
    cart = db.get(Cart, cart_id)
    if cart is not None:
        return cart

    cart = Cart(id=cart_id, user_id=user_id)
    db.add(cart)
    db.flush()
    return cart


def seed_database(db: Session) -> None:
    ensure_user(
        db,
        full_name="Demo Customer",
        email="customer@example.com",
        role="customer",
        password="password123",
    )
    ensure_user(
        db,
        full_name="Admin User",
        email=settings.seed_admin_email,
        role="admin",
        password=settings.seed_admin_password,
    )
    ensure_user(
        db,
        full_name="Sales Manager",
        email="sales.manager@example.com",
        role="sales_manager",
        password="password123",
    )
    ensure_user(
        db,
        full_name="Product Manager",
        email="product.manager@example.com",
        role="product_manager",
        password="password123",
    )

    ensure_category(
        db,
        category_id=1,
        name="Woody",
        description="Deep woods, amber, and aromatic blends",
    )
    ensure_category(
        db,
        category_id=2,
        name="Fresh",
        description="Citrus, marine, and everyday fragrances",
    )
    ensure_category(
        db,
        category_id=3,
        name="Warm",
        description="Spiced, smoky, and evening scents",
    )
    ensure_category(
        db,
        category_id=4,
        name="Gift Sets",
        description="Ready-to-gift fragrance selections",
    )

    ensure_product(
        db,
        product_id=1,
        name="Bleu de Chanel",
        model="100 ml / 3.38 fl. oz.",
        serial_number="FRAG-BDC-100",
        description="Bleu de Chanel is a woody, spicy fragrance for everyday wear and evening occasions.",
        quantity_in_stock=8,
        price="210.00",
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=1,
    )
    ensure_product(
        db,
        product_id=2,
        name="Dior Sauvage",
        model="100 ml / 3.38 fl. oz.",
        serial_number="FRAG-DSG-100",
        description="Dior Sauvage is a fresh, spicy fragrance built around bergamot and amberwood.",
        quantity_in_stock=10,
        price="165.00",
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=2,
    )
    ensure_product(
        db,
        product_id=3,
        name="Tom Ford Noir Extreme",
        model="50 ml / 1.7 fl. oz.",
        serial_number="FRAG-TFNE-050",
        description="Tom Ford Noir Extreme is a warm, spicy scent with amber and vanilla notes.",
        quantity_in_stock=5,
        price="195.00",
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=3,
    )
    ensure_product(
        db,
        product_id=4,
        name="Discovery Gift Set",
        model="5 x 10 ml / 0.34 fl. oz.",
        serial_number="FRAG-GIFT-SET",
        description="A curated discovery set for trying multiple signature scents before choosing a bottle.",
        quantity_in_stock=14,
        price="89.00",
        warranty_status="Authenticity guaranteed",
        distributor_info="Fragrance shop demo catalog",
        category_id=4,
    )

    ensure_cart(db, cart_id=1, user_id=None)
    db.commit()