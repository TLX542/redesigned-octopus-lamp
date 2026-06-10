"""Add delivery list entries table"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260610_0006"
down_revision: Union[str, Sequence[str], None] = "20260610_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "delivery_list_entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("order_id"),
    )
    op.create_index("ix_delivery_list_entries_order_id", "delivery_list_entries", ["order_id"])
    op.create_index("ix_delivery_list_entries_user_id", "delivery_list_entries", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_delivery_list_entries_user_id", table_name="delivery_list_entries")
    op.drop_index("ix_delivery_list_entries_order_id", table_name="delivery_list_entries")
    op.drop_table("delivery_list_entries")
