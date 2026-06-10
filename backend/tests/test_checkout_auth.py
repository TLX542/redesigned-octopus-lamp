from fastapi.testclient import TestClient

from app.db.models import DeliveryListEntry, Order
from tests.conftest import auth_headers


def test_checkout_requires_authentication(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]
    cart_id = 1

    add_response = client.post(
        f"/api/carts/{cart_id}/items",
        json={"product_id": product.id, "quantity": 1},
    )
    assert add_response.status_code == 200

    response = client.post(f"/api/carts/{cart_id}/checkout")

    assert response.status_code == 401


def test_authenticated_checkout_creates_order_for_logged_in_user(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    customer = sample_data["customer"]
    cart_id = 1

    add_response = client.post(
        f"/api/carts/{cart_id}/items",
        json={"product_id": product.id, "quantity": 1},
    )
    assert add_response.status_code == 200

    response = client.post(f"/api/carts/{cart_id}/checkout", headers=auth_headers(customer))

    assert response.status_code == 200
    invoice = response.json()
    assert invoice["item_count"] == 1
    assert invoice["items"][0]["product_id"] == product.id


def test_authenticated_checkout_creates_delivery_list_entry(
    client: TestClient,
    db_session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    customer = sample_data["customer"]
    cart_id = 1

    add_response = client.post(
        f"/api/carts/{cart_id}/items",
        json={"product_id": product.id, "quantity": 1},
    )
    assert add_response.status_code == 200

    checkout_response = client.post(f"/api/carts/{cart_id}/checkout", headers=auth_headers(customer))
    assert checkout_response.status_code == 200
    checkout_payload = checkout_response.json()

    order = db_session.get(Order, checkout_payload["db_order_id"])
    assert order is not None

    delivery_entry = db_session.query(DeliveryListEntry).filter_by(order_id=order.id).one_or_none()
    assert delivery_entry is not None
    assert delivery_entry.user_id == customer.id


def test_add_to_cart_rejects_out_of_stock_product(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    product.quantity_in_stock = 0

    response = client.post(
        "/api/carts/1/items",
        json={"product_id": product.id, "quantity": 1},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Product is out of stock."


def test_add_to_cart_rejects_quantity_above_stock(
    client: TestClient,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    product.quantity_in_stock = 2

    first_response = client.post(
        "/api/carts/1/items",
        json={"product_id": product.id, "quantity": 1},
    )
    assert first_response.status_code == 200

    second_response = client.post(
        "/api/carts/1/items",
        json={"product_id": product.id, "quantity": 2},
    )

    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Only 2 items available in stock."
