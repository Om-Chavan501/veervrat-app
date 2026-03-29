"""remove_irrational_belief

Revision ID: fd8690fbcdf3
Revises: dcb4b20a3b16
Create Date: 2026-03-29 18:08:25.176859

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd8690fbcdf3'
down_revision: Union[str, None] = 'dcb4b20a3b16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE sentence_journey_assessment_links DROP COLUMN irrational_belief")
    op.execute("DROP TYPE irrationalbelief")


def downgrade() -> None:
    op.execute("CREATE TYPE irrationalbelief AS ENUM ('MUST_BE_LOVED', 'MUST_BE_COMPETENT', 'MUST_HAVE_COMFORT')")
    op.execute("ALTER TABLE sentence_journey_assessment_links ADD COLUMN irrational_belief irrationalbelief")
