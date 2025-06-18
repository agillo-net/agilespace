-- Remove tracks table and update sessions to use GitHub issue URL directly

-- First, drop the foreign key constraint from sessions table
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_track_id_fkey;

-- Drop the tracks table entirely
DROP TABLE IF EXISTS tracks;

-- Add github_issue_url column to sessions table and remove track_id
ALTER TABLE sessions 
  DROP COLUMN IF EXISTS track_id,
  ADD COLUMN github_issue_url text NOT NULL DEFAULT '';

-- Add index on github_issue_url for efficient querying
CREATE INDEX IF NOT EXISTS idx_sessions_github_issue_url ON sessions(github_issue_url);

-- Add index on space_member_id and github_issue_url combination for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_space_member_github_issue ON sessions(space_member_id, github_issue_url);
