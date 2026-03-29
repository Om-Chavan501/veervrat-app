"""add_user_vratmitras

Revision ID: dcb4b20a3b16
Revises: 7cc89eb7f8dc
Create Date: 2026-03-29 16:34:28.776479

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'dcb4b20a3b16'
down_revision: Union[str, None] = '7cc89eb7f8dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE user_vratmitras (
            id VARCHAR NOT NULL PRIMARY KEY,
            user_id VARCHAR NOT NULL REFERENCES users(id),
            vratmitra_id VARCHAR NOT NULL REFERENCES users(id),
            status vratmitrastatus NOT NULL,
            invited_at TIMESTAMP,
            accepted_at TIMESTAMP,
            detached_at TIMESTAMP,
            UNIQUE (user_id)
        )
    """)
    op.execute("CREATE INDEX ix_user_lower_name ON users (lower(name))")
    op.execute("CREATE INDEX ix_user_lower_email ON users (lower(email))")


def downgrade() -> None:
    op.drop_index('ix_user_lower_email', table_name='users')
    op.drop_index('ix_user_lower_name', table_name='users')
    op.drop_table('user_vratmitras')

    op.create_table('challenge_instances',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('journey_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('status', postgresql.ENUM('APPLIED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', name='challengestatus'), autoincrement=False, nullable=False),
    sa.Column('application_note', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('approval_note', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('started_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('completed_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['journey_id'], ['sentence_journeys.id'], name='challenge_instances_journey_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='challenge_instances_pkey')
    )
    op.create_table('community_exposures',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('sentence_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('description', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('governance', postgresql.ENUM('PROPOSED', 'APPROVED', 'REJECTED', name='governancestatus'), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['sentence_id'], ['sentences.id'], name='community_exposures_sentence_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='community_exposures_pkey'),
    postgresql_ignore_search_path=False
    )
    op.create_table('exposure_recommendations',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('exposure_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('journey_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('recommended_by', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['exposure_id'], ['community_exposures.id'], name='exposure_recommendations_exposure_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='exposure_recommendations_pkey')
    )
    op.create_table('community_resolutions',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('sentence_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('text', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('governance', postgresql.ENUM('PROPOSED', 'APPROVED', 'REJECTED', name='governancestatus'), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['sentence_id'], ['sentences.id'], name='community_resolutions_sentence_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='community_resolutions_pkey'),
    postgresql_ignore_search_path=False
    )
    op.create_table('community_challenges',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('sentence_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('description', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('governance', postgresql.ENUM('PROPOSED', 'APPROVED', 'REJECTED', name='governancestatus'), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['sentence_id'], ['sentences.id'], name='community_challenges_sentence_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='community_challenges_pkey')
    )
    op.create_table('resolution_recommendations',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('resolution_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('journey_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('recommended_by', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['resolution_id'], ['community_resolutions.id'], name='resolution_recommendations_resolution_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='resolution_recommendations_pkey')
    )
    # ### end Alembic commands ###
