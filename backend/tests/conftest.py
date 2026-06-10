from collections.abc import Generator
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.models import Category, Order, OrderItem, Product, ProductReview, User
from app.main import app


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture(autouse=True)
def reset_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        test_client.close()
    app.dependency_overrides.clear()


@pytest.fixture
def sample_data(db_session: Session) -> dict[str, object]:
    admin = User(
        full_name="Admin User",
        email="admin@example.com",
        role="admin",
        hashed_password=hash_password("password123"),
    )
    customer = User(
        full_name="Customer User",
        email="customer@example.com",
        role="customer",
        hashed_password=hash_password("password123"),
    )
    other_customer = User(
        full_name="Other Customer",
        email="other@example.com",
        role="customer",
        hashed_password=hash_password("password123"),
    )
    category = Category(name="Fragrance", description="Fine fragrances")
    db_session.add_all([admin, customer, other_customer, category])
    db_session.flush()

    product = Product(
        name="Bleu de Chanel",
        model="EDP",
        serial_number="BDC-001",
        description="Woody aromatic fragrance",
        quantity_in_stock=12,
        price=Decimal("129.99"),
        warranty_status="Valid",
        distributor_info="Chanel",
        category_id=category.id,
    )
    db_session.add(product)
    db_session.flush()

    customer_order = Order(user_id=customer.id, status="delivered", total_amount=product.price)
    other_customer_order = Order(user_id=other_customer.id, status="delivered", total_amount=product.price)
    db_session.add_all([customer_order, other_customer_order])
    db_session.flush()
    db_session.add_all(
        [
            OrderItem(
                order_id=customer_order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=1,
                unit_price=product.price,
            ),
            OrderItem(
                order_id=other_customer_order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=1,
                unit_price=product.price,
            ),
        ]
    )

    approved_review = ProductReview(
        product_id=product.id,
        user_id=other_customer.id,
        rating=5,
        comment="Excellent fragrance.",
        status="approved",
    )
    pending_review = ProductReview(
        product_id=product.id,
        user_id=customer.id,
        rating=4,
        comment="Waiting for approval.",
        status="pending",
    )
    db_session.add_all([approved_review, pending_review])
    db_session.commit()

    return {
        "admin": admin,
        "customer": customer,
        "other_customer": other_customer,
        "category": category,
        "product": product,
        "approved_review": approved_review,
        "pending_review": pending_review,
    }


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(str(user.id))}"}
