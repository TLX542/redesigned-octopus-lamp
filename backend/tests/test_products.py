from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from conftest import auth_headers
from app.db.models import Category, Product


def test_product_list_can_filter_by_category(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    base_product = sample_data["product"]
    second_category = Category(name="Gift Sets", description="Giftable products")
    db_session.add(second_category)
    db_session.flush()

    second_product = Product(
        name="Discovery Set",
        model="5 x 10 ml",
        serial_number="DISC-001",
        description="Discovery fragrance set",
        quantity_in_stock=4,
        price=Decimal("89.00"),
        warranty_status="Valid",
        distributor_info="Demo Distributor",
        category_id=second_category.id,
    )
    db_session.add(second_product)
    db_session.commit()

    response = client.get(f"/api/products?category_id={base_product.category_id}")

    assert response.status_code == 200
    products = response.json()
    assert [product["id"] for product in products] == [base_product.id]


def test_sales_manager_can_apply_discount_to_selected_products(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    admin = sample_data["admin"]
    base_product = sample_data["product"]
    second_product = Product(
        name="Discovery Set",
        model="5 x 10 ml",
        serial_number="DISC-002",
        description="Discovery fragrance set",
        quantity_in_stock=4,
        price=Decimal("89.00"),
        warranty_status="Valid",
        distributor_info="Demo Distributor",
        category_id=base_product.category_id,
    )
    db_session.add(second_product)
    db_session.commit()

    response = client.patch(
        "/api/products/discounts",
        json={
            "product_ids": [base_product.id, second_product.id],
            "discount_rate": 15,
        },
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    data = response.json()
    updated_products = data["updated_products"]
    assert [item["product"]["id"] for item in updated_products] == [
        base_product.id,
        second_product.id,
    ]
    assert updated_products[0]["original_price"] == "129.99"
    assert updated_products[0]["discounted_price"] == "110.49"
    assert updated_products[0]["product"]["price"] == "110.49"
    assert updated_products[1]["original_price"] == "89.00"
    assert updated_products[1]["discounted_price"] == "75.65"
    assert updated_products[1]["product"]["price"] == "75.65"

    db_session.refresh(base_product)
    db_session.refresh(second_product)
    assert base_product.price == Decimal("110.49")
    assert second_product.price == Decimal("75.65")


def test_customer_can_manage_wishlist_items(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    customer = sample_data["customer"]
    product = sample_data["product"]
    headers = auth_headers(customer)

    empty_response = client.get("/api/wishlist", headers=headers)
    assert empty_response.status_code == 200
    assert empty_response.json() == []

    create_response = client.post(
        "/api/wishlist/items",
        json={"product_id": product.id},
        headers=headers,
    )
    assert create_response.status_code == 201
    assert create_response.json()["product"]["id"] == product.id

    duplicate_response = client.post(
        "/api/wishlist/items",
        json={"product_id": product.id},
        headers=headers,
    )
    assert duplicate_response.status_code == 201
    assert duplicate_response.json()["product"]["id"] == product.id

    list_response = client.get("/api/wishlist", headers=headers)
    assert list_response.status_code == 200
    assert [item["product"]["id"] for item in list_response.json()] == [product.id]

    delete_response = client.delete(f"/api/wishlist/items/{product.id}", headers=headers)
    assert delete_response.status_code == 204

    final_response = client.get("/api/wishlist", headers=headers)
    assert final_response.status_code == 200
    assert final_response.json() == []


def test_discount_creates_notifications_for_wishlist_users(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    admin = sample_data["admin"]
    customer = sample_data["customer"]
    product = sample_data["product"]

    wishlist_response = client.post(
        "/api/wishlist/items",
        json={"product_id": product.id},
        headers=auth_headers(customer),
    )
    assert wishlist_response.status_code == 201

    discount_response = client.patch(
        "/api/products/discounts",
        json={
            "product_ids": [product.id],
            "discount_rate": 20,
        },
        headers=auth_headers(admin),
    )

    assert discount_response.status_code == 200
    assert discount_response.json()["notification_count"] == 1

    notification_response = client.get(
        "/api/notifications/discounts",
        headers=auth_headers(customer),
    )
    assert notification_response.status_code == 200
    notifications = notification_response.json()
    assert len(notifications) == 1
    assert notifications[0]["product_id"] == product.id
    assert notifications[0]["product_name"] == product.name
    assert notifications[0]["discount_rate"] == "20.00"
    assert notifications[0]["original_price"] == "129.99"
    assert notifications[0]["discounted_price"] == "103.99"
    assert notifications[0]["is_read"] is False

    read_response = client.patch(
        "/api/notifications/discounts/read",
        headers=auth_headers(customer),
    )
    assert read_response.status_code == 200
    assert read_response.json()[0]["is_read"] is True


def test_customer_cannot_apply_product_discounts(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    customer = sample_data["customer"]
    product = sample_data["product"]

    response = client.patch(
        "/api/products/discounts",
        json={
            "product_ids": [product.id],
            "discount_rate": 10,
        },
        headers=auth_headers(customer),
    )

    assert response.status_code == 403


def test_discount_returns_404_for_missing_products(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    admin = sample_data["admin"]

    response = client.patch(
        "/api/products/discounts",
        json={
            "product_ids": [999],
            "discount_rate": 10,
        },
        headers=auth_headers(admin),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Products not found: 999"
