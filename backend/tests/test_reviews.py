from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import Order, OrderItem, ProductReview, User
from tests.conftest import auth_headers


def test_public_review_list_only_returns_approved_reviews(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]

    response = client.get(f"/api/products/{product.id}/reviews")

    assert response.status_code == 200
    reviews = response.json()
    assert [review["status"] for review in reviews] == ["approved"]
    assert reviews[0]["user_full_name"] == "Other Customer"


def test_review_author_can_see_their_pending_review(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]
    customer = sample_data["customer"]

    response = client.get(f"/api/products/{product.id}/reviews", headers=auth_headers(customer))

    assert response.status_code == 200
    statuses = {review["status"] for review in response.json()}
    assert statuses == {"approved", "pending"}


def test_customer_can_create_one_review_per_product(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]
    customer = sample_data["customer"]

    response = client.post(
        f"/api/products/{product.id}/reviews",
        headers=auth_headers(customer),
        json={"rating": 5, "comment": "I changed my mind."},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "You have already reviewed this product"


def test_unauthenticated_customer_cannot_create_review(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]

    response = client.post(
        f"/api/products/{product.id}/reviews",
        json={"rating": 5, "comment": "Lovely."},
    )

    assert response.status_code == 401


def test_review_create_rejects_missing_product(client: TestClient, sample_data: dict[str, object]) -> None:
    admin = sample_data["admin"]

    response = client.post(
        "/api/products/9999/reviews",
        headers=auth_headers(admin),
        json={"rating": 5, "comment": "No product here."},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


def test_review_create_rejects_out_of_range_rating(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]
    admin = sample_data["admin"]

    response = client.post(
        f"/api/products/{product.id}/reviews",
        headers=auth_headers(admin),
        json={"rating": 6, "comment": "Too generous."},
    )

    assert response.status_code == 422


def test_review_create_strips_comment_whitespace(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    new_customer = User(
        full_name="Fresh Customer",
        email="fresh@example.com",
        role="customer",
        hashed_password=hash_password("password123"),
    )
    db_session.add(new_customer)
    db_session.flush()
    order = Order(user_id=new_customer.id, status="delivered", total_amount=product.price)
    db_session.add(order)
    db_session.flush()
    db_session.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=1,
            unit_price=product.price,
        )
    )
    db_session.commit()

    response = client.post(
        f"/api/products/{product.id}/reviews",
        headers=auth_headers(new_customer),
        json={"rating": 3, "comment": "   Balanced and clean.   "},
    )

    assert response.status_code == 201
    assert response.json()["comment"] == "Balanced and clean."
    assert response.json()["status"] == "pending"


def test_review_create_allows_rating_without_comment_and_lists_for_admin(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    admin = sample_data["admin"]
    new_customer = User(
        full_name="Rating Only Customer",
        email="rating-only@example.com",
        role="customer",
        hashed_password=hash_password("password123"),
    )
    db_session.add(new_customer)
    db_session.flush()
    order = Order(user_id=new_customer.id, status="delivered", total_amount=product.price)
    db_session.add(order)
    db_session.flush()
    db_session.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=1,
            unit_price=product.price,
        )
    )
    db_session.commit()

    response = client.post(
        f"/api/products/{product.id}/reviews",
        headers=auth_headers(new_customer),
        json={"rating": 4},
    )

    assert response.status_code == 201
    review = response.json()
    assert review["comment"] == ""
    assert review["status"] == "pending"

    admin_response = client.get("/api/admin/reviews", headers=auth_headers(admin))

    assert admin_response.status_code == 200
    assert any(admin_review["id"] == review["id"] for admin_review in admin_response.json())


def test_review_create_requires_delivered_purchase(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    new_customer = User(
        full_name="No Delivery Customer",
        email="no-delivery@example.com",
        role="customer",
        hashed_password=hash_password("password123"),
    )
    db_session.add(new_customer)
    db_session.commit()

    response = client.post(
        f"/api/products/{product.id}/reviews",
        headers=auth_headers(new_customer),
        json={"rating": 5, "comment": "I should not be able to review this yet."},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You can review this product after it has been delivered to you."


def test_review_update_resets_status_to_pending(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    review = sample_data["approved_review"]
    author = sample_data["other_customer"]

    response = client.patch(
        f"/api/products/{product.id}/reviews/{review.id}",
        headers=auth_headers(author),
        json={"rating": 4, "comment": "Still good after another try."},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "pending"
    db_session.refresh(review)
    assert review.status == "pending"
    assert review.comment == "Still good after another try."


def test_review_rating_update_keeps_existing_comment_status(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    review = sample_data["approved_review"]
    author = sample_data["other_customer"]

    response = client.patch(
        f"/api/products/{product.id}/reviews/{review.id}",
        headers=auth_headers(author),
        json={"rating": 4},
    )

    assert response.status_code == 200
    assert response.json()["rating"] == 4
    assert response.json()["status"] == "approved"
    db_session.refresh(review)
    assert review.status == "approved"


def test_non_author_cannot_update_review(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]
    review = sample_data["approved_review"]
    customer = sample_data["customer"]

    response = client.patch(
        f"/api/products/{product.id}/reviews/{review.id}",
        headers=auth_headers(customer),
        json={"rating": 1},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Review can only be edited by its author"


def test_update_review_allows_clearing_comment(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    review = sample_data["pending_review"]
    customer = sample_data["customer"]

    response = client.patch(
        f"/api/products/{product.id}/reviews/{review.id}",
        headers=auth_headers(customer),
        json={"comment": "   "},
    )

    assert response.status_code == 200
    assert response.json()["comment"] == ""
    db_session.refresh(review)
    assert review.comment == ""


def test_review_author_can_delete_their_review(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    product = sample_data["product"]
    review = sample_data["pending_review"]
    customer = sample_data["customer"]

    response = client.delete(
        f"/api/products/{product.id}/reviews/{review.id}",
        headers=auth_headers(customer),
    )

    assert response.status_code == 204
    assert db_session.get(ProductReview, review.id) is None


def test_non_author_cannot_delete_review(client: TestClient, sample_data: dict[str, object]) -> None:
    product = sample_data["product"]
    review = sample_data["approved_review"]
    customer = sample_data["customer"]

    response = client.delete(
        f"/api/products/{product.id}/reviews/{review.id}",
        headers=auth_headers(customer),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Review can only be deleted by its author"


def test_admin_can_moderate_review(client: TestClient, sample_data: dict[str, object]) -> None:
    admin = sample_data["admin"]
    pending_review = sample_data["pending_review"]

    response = client.patch(
        f"/api/admin/reviews/{pending_review.id}",
        headers=auth_headers(admin),
        json={"status": "approved"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_admin_review_list_prioritizes_pending_reviews(client: TestClient, sample_data: dict[str, object]) -> None:
    admin = sample_data["admin"]

    response = client.get("/api/admin/reviews", headers=auth_headers(admin))

    assert response.status_code == 200
    reviews = response.json()
    assert reviews[0]["status"] == "pending"
    assert {review["status"] for review in reviews} == {"approved", "pending"}


def test_admin_can_delete_review(
    client: TestClient,
    db_session: Session,
    sample_data: dict[str, object],
) -> None:
    admin = sample_data["admin"]
    review = sample_data["pending_review"]

    response = client.delete(f"/api/admin/reviews/{review.id}", headers=auth_headers(admin))

    assert response.status_code == 204
    assert db_session.scalar(select(ProductReview).where(ProductReview.id == review.id)) is None


def test_admin_delete_review_returns_404_for_missing_review(client: TestClient, sample_data: dict[str, object]) -> None:
    admin = sample_data["admin"]

    response = client.delete("/api/admin/reviews/9999", headers=auth_headers(admin))

    assert response.status_code == 404
    assert response.json()["detail"] == "Review not found"


def test_customer_cannot_access_admin_reviews(client: TestClient, sample_data: dict[str, object]) -> None:
    customer = sample_data["customer"]

    response = client.get("/api/admin/reviews", headers=auth_headers(customer))

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required"


def test_last_admin_cannot_be_demoted(client: TestClient, db_session: Session, sample_data: dict[str, object]) -> None:
    admin = sample_data["admin"]

    response = client.patch(
        f"/api/admin/users/{admin.id}",
        headers=auth_headers(admin),
        json={"role": "customer"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "At least one admin account must remain"
    assert db_session.get(User, admin.id).role == "admin"
