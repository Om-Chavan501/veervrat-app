"""journey_redesign

Revision ID: 402303c7d0bc
Revises: fd8690fbcdf3
Create Date: 2026-03-29 18:19:01.646544

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '402303c7d0bc'
down_revision: Union[str, None] = 'fd8690fbcdf3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add originating_assessment_id to sentence_journeys
    op.execute("""
        ALTER TABLE sentence_journeys
        ADD COLUMN originating_assessment_id VARCHAR REFERENCES lacuna_assessments(id)
    """)

    # 2. Create enum types
    op.execute("CREATE TYPE exposurestatus AS ENUM ('PLANNED', 'TAKEN', 'SKIPPED')")
    op.execute("CREATE TYPE resolutionstatus AS ENUM ('ACTIVE', 'PAUSED', 'DONE')")
    # Drop orphaned challenge_instances table (empty, no model) and its stale enum, then recreate
    op.execute("DROP TABLE IF EXISTS challenge_instances")
    op.execute("DROP TYPE IF EXISTS challengestatus")
    op.execute("CREATE TYPE challengestatus AS ENUM ('PLANNED', 'COMPLETED', 'ABANDONED')")

    # 3. Create catalog tables
    op.execute("""
        CREATE TABLE exposure_catalog_items (
            id VARCHAR NOT NULL PRIMARY KEY,
            sentence_id VARCHAR NOT NULL REFERENCES sentences(id),
            title VARCHAR NOT NULL,
            description TEXT
        )
    """)
    op.execute("""
        CREATE TABLE resolution_catalog_items (
            id VARCHAR NOT NULL PRIMARY KEY,
            sentence_id VARCHAR NOT NULL REFERENCES sentences(id),
            title VARCHAR NOT NULL,
            description TEXT,
            frequency_hint VARCHAR
        )
    """)
    op.execute("""
        CREATE TABLE challenge_catalog_items (
            id VARCHAR NOT NULL PRIMARY KEY,
            sentence_id VARCHAR NOT NULL REFERENCES sentences(id),
            title VARCHAR NOT NULL,
            description TEXT,
            achievement_criteria TEXT
        )
    """)

    # 4. Create journey activity tables
    op.execute("""
        CREATE TABLE journey_exposures (
            id VARCHAR NOT NULL PRIMARY KEY,
            journey_id VARCHAR NOT NULL REFERENCES sentence_journeys(id),
            catalog_item_id VARCHAR REFERENCES exposure_catalog_items(id),
            title VARCHAR NOT NULL,
            description TEXT,
            status exposurestatus NOT NULL DEFAULT 'PLANNED',
            taken_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE journey_resolutions (
            id VARCHAR NOT NULL PRIMARY KEY,
            journey_id VARCHAR NOT NULL REFERENCES sentence_journeys(id),
            catalog_item_id VARCHAR REFERENCES resolution_catalog_items(id),
            title VARCHAR NOT NULL,
            description TEXT,
            frequency VARCHAR NOT NULL,
            status resolutionstatus NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE journey_challenges (
            id VARCHAR NOT NULL PRIMARY KEY,
            journey_id VARCHAR NOT NULL REFERENCES sentence_journeys(id),
            catalog_item_id VARCHAR REFERENCES challenge_catalog_items(id),
            title VARCHAR NOT NULL,
            description TEXT,
            achievement_criteria TEXT NOT NULL,
            status challengestatus NOT NULL DEFAULT 'PLANNED',
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE (journey_id)
        )
    """)

    # 5. Migrate exposure_instances → journey_exposures
    op.execute("""
        INSERT INTO journey_exposures (id, journey_id, catalog_item_id, title, description, status, taken_at, created_at)
        SELECT id, journey_id, NULL, LEFT(description, 120), context_note, 'TAKEN', created_at, created_at
        FROM exposure_instances
    """)

    # 6. Migrate resolution_instances → journey_resolutions
    op.execute("""
        INSERT INTO journey_resolutions (id, journey_id, catalog_item_id, title, description, frequency, status, created_at)
        SELECT id, journey_id, NULL, text, NULL, frequency, 'ACTIVE', created_at
        FROM resolution_instances
    """)

    # 7. Drop old tables
    op.execute("DROP TABLE exposure_instances")
    op.execute("DROP TABLE resolution_instances")


def downgrade() -> None:
    # Recreate old tables
    op.execute("""
        CREATE TABLE exposure_instances (
            id VARCHAR NOT NULL PRIMARY KEY,
            journey_id VARCHAR NOT NULL REFERENCES sentence_journeys(id),
            description TEXT NOT NULL,
            context_note TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE resolution_instances (
            id VARCHAR NOT NULL PRIMARY KEY,
            journey_id VARCHAR NOT NULL REFERENCES sentence_journeys(id),
            text TEXT NOT NULL,
            frequency VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # Migrate back (best-effort)
    op.execute("""
        INSERT INTO exposure_instances (id, journey_id, description, context_note, created_at)
        SELECT id, journey_id, title, description, created_at
        FROM journey_exposures WHERE status = 'TAKEN'
    """)
    op.execute("""
        INSERT INTO resolution_instances (id, journey_id, text, frequency, created_at)
        SELECT id, journey_id, title, frequency, created_at
        FROM journey_resolutions
    """)

    # Drop new tables
    op.execute("DROP TABLE journey_challenges")
    op.execute("DROP TABLE journey_resolutions")
    op.execute("DROP TABLE journey_exposures")
    op.execute("DROP TABLE challenge_catalog_items")
    op.execute("DROP TABLE resolution_catalog_items")
    op.execute("DROP TABLE exposure_catalog_items")

    # Drop enum types
    op.execute("DROP TYPE challengestatus")
    op.execute("DROP TYPE resolutionstatus")
    op.execute("DROP TYPE exposurestatus")

    # Drop column
    op.execute("ALTER TABLE sentence_journeys DROP COLUMN originating_assessment_id")
