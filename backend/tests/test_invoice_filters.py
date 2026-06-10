from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from conftest import auth_headers
from app.core.security import hash_password
from app.db.models import Order, User


def create_sales_manager(db_session: Session) -> User:
    sales_manager = User(
        full_name="Sales Manager",
        email="sales.manager.test@example.com",
        role="sales_manager",
        hashed_password=hash_password("password123"),
    )
    db_session.add(sales_manager)
    db_session.commit()
    return sales_manager


def create_order(db_session: Session, *, user_id: int, created_at: datetime) -> Order:
    order = Order(
        user_id=user_id,
        status="processing",
        total_amount=Decimal("100.00"),
        created_at=created_at,
    )
    db_session.add(order)
    db_session.commit()
    return order


def test_sales_manager_can_filter_invoices_by_start_and_end_date(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    customer = sample_data["customer"]
    sales_manager = create_sales_manager(db_session)
    old_order = create_order(
        db_session,
        user_id=customer.id,
        created_at=datetime(2026, 4, 15, 12, 0, tzinfo=UTC),
    )
    first_matching_order = create_order(
        db_session,
        user_id=customer.id,
        created_at=datetime(2026, 4, 20, 9, 30, tzinfo=UTC),
    )
    second_matching_order = create_order(
        db_session,
        user_id=customer.id,
        created_at=datetime(2026, 4, 22, 23, 59, tzinfo=UTC),
    )
    future_order = create_order(
        db_session,
        user_id=customer.id,
        created_at=datetime(2026, 4, 23, 0, 0, tzinfo=UTC),
    )

    response = client.get(
        "/api/orders/invoices?start_date=2026-04-20&end_date=2026-04-22",
        headers=auth_headers(sales_manager),
    )

    assert response.status_code == 200
    invoice_ids = [invoice["id"] for invoice in response.json()]
    assert invoice_ids == [second_matching_order.id, first_matching_order.id]
    assert old_order.id not in invoice_ids
    assert future_order.id not in invoice_ids


def test_invoice_filter_rejects_invalid_date_range(
    client: TestClient,
    db_session: Session,
) -> None:
    sales_manager = create_sales_manager(db_session)

    response = client.get(
        "/api/orders/invoices?start_date=2026-04-23&end_date=2026-04-20",
        headers=auth_headers(sales_manager),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "start_date must be before or equal to end_date"


def test_customer_cannot_filter_invoices(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    customer = sample_data["customer"]

    response = client.get(
        "/api/orders/invoices?start_date=2026-04-20&end_date=2026-04-22",
        headers=auth_headers(customer),
    )

    assert response.status_code == 403
