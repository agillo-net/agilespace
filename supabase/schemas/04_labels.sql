-- Labels table
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  description TEXT
);

-- Session labels table
CREATE TABLE session_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  UNIQUE(session_id, label_id)
);

-- Function to add labels to a session
CREATE OR REPLACE FUNCTION add_session_labels(
  p_session_id UUID,
  p_labels UUID[]
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Add labels
  INSERT INTO session_labels (session_id, label_id)
  SELECT p_session_id, unnest(p_labels)
  ON CONFLICT (session_id, label_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for labels
CREATE POLICY "Everyone can view labels"
ON labels FOR SELECT
USING (true);

CREATE POLICY "Users can manage session labels"
ON session_labels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE s.id = session_labels.session_id 
    AND sp.user_id = auth.uid()
  )
);
