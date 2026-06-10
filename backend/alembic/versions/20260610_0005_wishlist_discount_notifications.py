"""Add wishlist and discount notifications"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260610_0005"
down_revision: Union[str, Sequence[str], None] = "20260505_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing_tables = set(sa.inspect(op.get_bind()).get_table_names())

    if "wishlist_items" not in existing_tables:
        op.create_table(
            "wishlist_items",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
            sa.UniqueConstraint("user_id", "product_id", name="uq_wishlist_items_user_product"),
        )
        op.create_index("ix_wishlist_items_user_id", "wishlist_items", ["user_id"])
        op.create_index("ix_wishlist_items_product_id", "wishlist_items", ["product_id"])

    if "discount_notifications" not in existing_tables:
        op.create_table(
            "discount_notifications",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("product_name", sa.String(length=255), nullable=False),
            sa.Column("discount_rate", sa.DECIMAL(5, 2), nullable=False),
            sa.Column("original_price", sa.DECIMAL(10, 2), nullable=False),
            sa.Column("discounted_price", sa.DECIMAL(10, 2), nullable=False),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_discount_notifications_user_id", "discount_notifications", ["user_id"])
        op.create_index("ix_discount_notifications_product_id", "discount_notifications", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_discount_notifications_product_id", table_name="discount_notifications")
    op.drop_index("ix_discount_notifications_user_id", table_name="discount_notifications")
    op.drop_table("discount_notifications")

    op.drop_index("ix_wishlist_items_product_id", table_name="wishlist_items")
    op.drop_index("ix_wishlist_items_user_id", table_name="wishlist_items")
    op.drop_table("wishlist_items")
