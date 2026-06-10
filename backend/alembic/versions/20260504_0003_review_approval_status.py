"""Add review approval status"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260504_0003"
down_revision: Union[str, Sequence[str], None] = "20260427_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "product_reviews",
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
    )
    op.execute("UPDATE product_reviews SET status = 'approved'")
    op.create_check_constraint(
        "ck_product_reviews_status",
        "product_reviews",
        "status IN ('pending', 'approved', 'rejected')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_product_reviews_status", "product_reviews", type_="check")
    op.drop_column("product_reviews", "status")
