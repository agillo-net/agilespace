-- Add track change support to session_duration_change_requests table
-- Rename table to session_change_requests to reflect broader scope
ALTER TABLE session_duration_change_requests RENAME TO session_change_requests;

-- Add columns for track changes
ALTER TABLE session_change_requests 
ADD COLUMN original_track_id uuid REFERENCES tracks(id),
ADD COLUMN requested_track_id uuid REFERENCES tracks(id);

-- Update the check constraint to include track changes
ALTER TABLE session_change_requests 
DROP CONSTRAINT session_duration_change_requests_status_check;

ALTER TABLE session_change_requests 
ADD CONSTRAINT session_change_requests_status_check 
CHECK (status in ('pending', 'approved', 'rejected'));

-- Update indexes to reflect new table name
DROP INDEX IF EXISTS idx_session_duration_change_requests_session_id;
DROP INDEX IF EXISTS idx_session_duration_change_requests_requested_by;
DROP INDEX IF EXISTS idx_session_duration_change_requests_status;
DROP INDEX IF EXISTS idx_session_duration_change_requests_created_at;

CREATE INDEX idx_session_change_requests_session_id ON session_change_requests(session_id);
CREATE INDEX idx_session_change_requests_requested_by ON session_change_requests(requested_by);
CREATE INDEX idx_session_change_requests_status ON session_change_requests(status);
CREATE INDEX idx_session_change_requests_created_at ON session_change_requests(created_at DESC);
CREATE INDEX idx_session_change_requests_original_track_id ON session_change_requests(original_track_id);
CREATE INDEX idx_session_change_requests_requested_track_id ON session_change_requests(requested_track_id);

-- Update RLS policies to reflect new table name
DROP POLICY IF EXISTS "Users can view change requests for their space sessions" ON session_change_requests;
DROP POLICY IF EXISTS "Users can create change requests for their own sessions" ON session_change_requests;
DROP POLICY IF EXISTS "Space members can update change requests" ON session_change_requests;

-- RLS Policies for the renamed table
-- Allow users to view requests for sessions in spaces they are members of
CREATE POLICY "Users can view change requests for their space sessions" 
  ON session_change_requests 
  FOR SELECT 
  USING (
    session_id IN (
      SELECT s.id 
      FROM sessions s
      JOIN tracks t ON s.track_id = t.id
      JOIN space_members sm ON t.space_id = sm.space_id
      WHERE sm.user_id = auth.uid()
    )
  );

-- Allow users to create requests for their own sessions
CREATE POLICY "Users can create change requests for their own sessions" 
  ON session_change_requests 
  FOR INSERT 
  WITH CHECK (
    requested_by = auth.uid() AND
    session_id IN (
      SELECT s.id 
      FROM sessions s
      JOIN space_members sm ON s.space_member_id = sm.id
      WHERE sm.user_id = auth.uid()
    )
  );

-- Allow space members to update requests (approve/reject)
CREATE POLICY "Space members can update change requests" 
  ON session_change_requests 
  FOR UPDATE 
  USING (
    session_id IN (
      SELECT s.id 
      FROM sessions s
      JOIN tracks t ON s.track_id = t.id
      JOIN space_members sm ON t.space_id = sm.space_id
      WHERE sm.user_id = auth.uid()
    )
  ); 
