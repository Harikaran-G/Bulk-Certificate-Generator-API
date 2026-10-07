"""initial_schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'jobs',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('status', sa.Enum('pending', 'processing', 'completed', 'completed_with_errors', 'failed', name='job_status_enum'), nullable=False),
        sa.Column('organization_name', sa.String(length=255), nullable=False, server_default='GLOBAL ACADEMY OF TECHNOLOGY & EXCELLENCE'),
        sa.Column('course_name', sa.String(length=255), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('total_recipients', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processed_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('successful_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jobs_status'), 'jobs', ['status'], unique=False)

    op.create_table(
        'certificates',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('job_id', sa.CHAR(length=36), nullable=False),
        sa.Column('recipient_name', sa.String(length=255), nullable=False),
        sa.Column('recipient_email', sa.String(length=255), nullable=False),
        sa.Column('course_name', sa.String(length=255), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'processing', 'completed', 'failed', name='certificate_status_enum'), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_certificates_job_id'), 'certificates', ['job_id'], unique=False)
    op.create_index(op.f('ix_certificates_status'), 'certificates', ['status'], unique=False)
    op.create_index('idx_certificates_job_status', 'certificates', ['job_id', 'status'], unique=False)
    op.create_index('idx_certificates_recipient_email', 'certificates', ['recipient_email'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_certificates_recipient_email', table_name='certificates')
    op.drop_index('idx_certificates_job_status', table_name='certificates')
    op.drop_index(op.f('ix_certificates_status'), table_name='certificates')
    op.drop_index(op.f('ix_certificates_job_id'), table_name='certificates')
    op.drop_table('certificates')
    op.drop_index(op.f('ix_jobs_status'), table_name='jobs')
    op.drop_table('jobs')
    op.execute("DROP TYPE IF EXISTS certificate_status_enum")
    op.execute("DROP TYPE IF EXISTS job_status_enum")
