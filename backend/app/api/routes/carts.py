from decimal import Decimal
from datetime import UTC, datetime

from sqlalchemy.orm import Session, selectinload

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.db.models import Cart, CartItem, DeliveryListEntry, Order, OrderItem, Product
from app.db.session import get_db
from app.schemas.cart import CartAddItem, CartItemRead, CartRead, CheckoutInvoiceItem, CheckoutInvoiceRead
from app.schemas.user import UserRead


router = APIRouter()


def calculate_total(cart: Cart) -> Decimal:
    return sum((item.unit_price * item.quantity for item in cart.items), start=Decimal("0.00"))


def serialize_cart(cart: Cart) -> CartRead:
    return CartRead(
        id=cart.id,
        user_id=cart.user_id,
        items=[
            CartItemRead.model_validate(item)
            for item in sorted(cart.items, key=lambda cart_item: cart_item.id)
        ],
        total_amount=calculate_total(cart),
    )


def get_or_create_cart(db: Session, cart_id: int) -> Cart:
    cart = (
        db.query(Cart)
        .options(selectinload(Cart.items))
        .filter(Cart.id == cart_id)
        .first()
    )
    if cart is None:
        cart = Cart(id=cart_id, user_id=None)
        db.add(cart)
        db.commit()

    return (
        db.query(Cart)
        .options(selectinload(Cart.items))
        .filter(Cart.id == cart_id)
        .first()
    )


@router.get("/{cart_id}", response_model=CartRead)
def get_cart(cart_id: int, db: Session = Depends(get_db)) -> CartRead:
    return serialize_cart(get_or_create_cart(db, cart_id))


@router.post("/{cart_id}/items", response_model=CartRead)
def add_item_to_cart(
    cart_id: int,
    payload: CartAddItem,
    db: Session = Depends(get_db),
) -> CartRead:
    cart = get_or_create_cart(db, cart_id)
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if payload.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero.",
        )
    if product.quantity_in_stock <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is out of stock.",
        )

    existing_quantity = sum(
        item.quantity for item in cart.items if item.product_id == product.id
    )
    requested_quantity = existing_quantity + payload.quantity
    if requested_quantity > product.quantity_in_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only {product.quantity_in_stock} item"
                f"{'' if product.quantity_in_stock == 1 else 's'} available in stock."
            ),
        )

    db.add(
        CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=payload.quantity,
            unit_price=product.price,
        )
    )
    db.commit()
    return serialize_cart(get_or_create_cart(db, cart_id))


@router.delete("/{cart_id}/items/{item_id}", response_model=CartRead)
def remove_item_from_cart(cart_id: int, item_id: int, db: Session = Depends(get_db)) -> CartRead:
    cart = get_or_create_cart(db, cart_id)
    item = next((cart_item for cart_item in cart.items if cart_item.id == item_id), None)
    if item is not None:
        db.delete(item)
        db.commit()
    return serialize_cart(get_or_create_cart(db, cart_id))


@router.post("/{cart_id}/checkout", response_model=CheckoutInvoiceRead)
def checkout_cart(
    cart_id: int,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CheckoutInvoiceRead:
    cart = (
        db.query(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .filter(Cart.id == cart_id)
        .first()
    )
    if cart is None or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty. Add items before checkout.",
        )

    for item in cart.items:
        if item.product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product #{item.product_id}.",
            )

    for item in cart.items:
        item.product.quantity_in_stock -= item.quantity

    now = datetime.now(UTC)
    order_id = f"ORD-{cart_id}-{int(now.timestamp())}"
    created_at = now.isoformat()
    invoice_items = [
        CheckoutInvoiceItem(
            product_id=item.product_id,
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=item.unit_price * item.quantity,
        )
        for item in sorted(cart.items, key=lambda cart_item: cart_item.id)
    ]
    total_amount = sum((invoice_item.line_total for invoice_item in invoice_items), start=Decimal("0.00"))
    item_count = sum(invoice_item.quantity for invoice_item in invoice_items)

    order = Order(
        user_id=current_user.id,
        status="processing",
        total_amount=total_amount,
    )
    db.add(order)
    db.flush()

    for item in sorted(cart.items, key=lambda cart_item: cart_item.id):
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
        )

    db.add(DeliveryListEntry(order_id=order.id, user_id=current_user.id))

    for item in list(cart.items):
        db.delete(item)
    db.commit()

    return CheckoutInvoiceRead(
        order_id=order_id,
        db_order_id=order.id,
        customer_name=current_user.full_name,
        customer_email=current_user.email,
        status=order.status,
        created_at=created_at,
        item_count=item_count,
        total_amount=total_amount,
        items=invoice_items,
    )
