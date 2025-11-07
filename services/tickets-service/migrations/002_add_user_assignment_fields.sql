-- Add fields to users table for auto-assignment functionality
-- These fields help track technician skills and assignment history

-- Add skills column (array of skill tags)
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Add last_assigned_at timestamp to track assignment history
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMP;

-- Add name column (computed from first_name and last_name for convenience)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

-- Add index for skills (for better performance when matching skills)
CREATE INDEX IF NOT EXISTS idx_users_skills ON users USING GIN(skills) WHERE deleted_at IS NULL;

-- Add index for last_assigned_at (for round-robin assignment)
CREATE INDEX IF NOT EXISTS idx_users_last_assigned ON users(last_assigned_at) WHERE deleted_at IS NULL AND is_active = true;

-- Add comments
COMMENT ON COLUMN users.skills IS 'Array of skill tags for auto-assignment matching (e.g., ["networking", "windows", "azure"])';
COMMENT ON COLUMN users.last_assigned_at IS 'Timestamp of last ticket assignment (for round-robin distribution)';
COMMENT ON COLUMN users.name IS 'Full name (computed from first_name and last_name)';

-- Update existing users to have an empty skills array if NULL
UPDATE users SET skills = '{}' WHERE skills IS NULL;
