"""add_invited_by_and_user_invites

Revision ID: 7cc89eb7f8dc
Revises: 
Create Date: 2026-03-29 12:46:46.057917

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7cc89eb7f8dc'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('invited_by', sa.String(), nullable=True))
    op.create_foreign_key(None, 'users', 'users', ['invited_by'], ['id'])
    op.create_table(
        'user_invites',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('code', sa.String(), nullable=False, unique=True),
        sa.Column('uses_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_invites_code', 'user_invites', ['code'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_user_invites_code', table_name='user_invites')
    op.drop_table('user_invites')
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_column('users', 'invited_by')
    op.create_table('resolution_recommendations',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('resolution_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('journey_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('recommended_by', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['resolution_id'], ['community_resolutions.id'], name='resolution_recommendations_resolution_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='resolution_recommendations_pkey')
    )
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
    sa.PrimaryKeyConstraint('id', name='community_resolutions_pkey')
    )
    op.create_table('community_exposures',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('sentence_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('description', sa.TEXT(), autoincrement=False, nullable=False),
    sa.Column('governance', postgresql.ENUM('PROPOSED', 'APPROVED', 'REJECTED', name='governancestatus'), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['sentence_id'], ['sentences.id'], name='community_exposures_sentence_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='community_exposures_pkey')
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
    # ### end Alembic commands ###
