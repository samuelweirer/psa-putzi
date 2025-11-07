-- Tickets Service Database Migration
-- Creates attachments table for ticket and comment file attachments
-- Run this migration after the core tickets schema exists

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Attachments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(255) NOT NULL,
    storage_type VARCHAR(50) DEFAULT 'local' NOT NULL CHECK (storage_type IN ('local', 's3')),
    s3_bucket VARCHAR(255),
    s3_key TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP,

    -- Constraint: attachment must belong to either a ticket or a comment, but not both
    CONSTRAINT attachment_parent_check CHECK (
        (ticket_id IS NOT NULL AND comment_id IS NULL) OR
        (ticket_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- =====================================================
-- Indexes
-- =====================================================
-- Ticket attachments lookup
CREATE INDEX IF NOT EXISTS idx_attachments_ticket
    ON attachments(ticket_id)
    WHERE deleted_at IS NULL AND ticket_id IS NOT NULL;

-- Comment attachments lookup
CREATE INDEX IF NOT EXISTS idx_attachments_comment
    ON attachments(comment_id)
    WHERE deleted_at IS NULL AND comment_id IS NOT NULL;

-- User attachments lookup
CREATE INDEX IF NOT EXISTS idx_attachments_user
    ON attachments(user_id)
    WHERE deleted_at IS NULL;

-- Created date for sorting
CREATE INDEX IF NOT EXISTS idx_attachments_created
    ON attachments(created_at DESC);

-- File path lookup (for cleanup operations)
CREATE INDEX IF NOT EXISTS idx_attachments_file_path
    ON attachments(file_path)
    WHERE deleted_at IS NULL;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE attachments IS 'File attachments for tickets and comments';
COMMENT ON COLUMN attachments.ticket_id IS 'Parent ticket (null if attached to comment)';
COMMENT ON COLUMN attachments.comment_id IS 'Parent comment (null if attached to ticket)';
COMMENT ON COLUMN attachments.user_id IS 'User who uploaded the file';
COMMENT ON COLUMN attachments.filename IS 'Unique filename on disk (UUID-based)';
COMMENT ON COLUMN attachments.original_filename IS 'Original filename from user upload';
COMMENT ON COLUMN attachments.file_path IS 'Full path to file on disk or S3';
COMMENT ON COLUMN attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN attachments.mime_type IS 'File MIME type (e.g., image/png, application/pdf)';
COMMENT ON COLUMN attachments.storage_type IS 'Storage backend: local filesystem or S3';
COMMENT ON COLUMN attachments.s3_bucket IS 'S3 bucket name (null for local storage)';
COMMENT ON COLUMN attachments.s3_key IS 'S3 object key (null for local storage)';
COMMENT ON COLUMN attachments.metadata IS 'Additional metadata (JSON): uploaded_from, user_agent, etc.';
COMMENT ON COLUMN attachments.created_at IS 'Upload timestamp';
COMMENT ON COLUMN attachments.deleted_at IS 'Soft delete timestamp (null = active)';

-- =====================================================
-- Functions
-- =====================================================
-- Function to get attachment stats for a ticket
CREATE OR REPLACE FUNCTION get_ticket_attachment_stats(p_ticket_id UUID)
RETURNS TABLE (
    count BIGINT,
    total_size BIGINT
) AS $$
    SELECT
        COUNT(*)::BIGINT,
        COALESCE(SUM(file_size), 0)::BIGINT
    FROM attachments
    WHERE ticket_id = p_ticket_id
      AND deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_ticket_attachment_stats IS 'Get attachment count and total size for a ticket';

-- =====================================================
-- Triggers
-- =====================================================
-- Prevent hard deletes (enforce soft delete pattern)
CREATE OR REPLACE FUNCTION prevent_attachment_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Hard deletes are not allowed on attachments. Use soft delete (deleted_at) instead.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_attachment_hard_delete
    BEFORE DELETE ON attachments
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL)
    EXECUTE FUNCTION prevent_attachment_hard_delete();

COMMENT ON TRIGGER trg_prevent_attachment_hard_delete ON attachments IS 'Prevent accidental hard deletes - enforce soft delete pattern';

-- =====================================================
-- Grants
-- =====================================================
-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE ON attachments TO psa_app_role;
-- Note: DELETE is blocked by trigger, updates to deleted_at are allowed
