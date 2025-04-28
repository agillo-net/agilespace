CREATE TABLE sessions (
  github_issue_link TEXT NOT NULL,
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notes TEXT, -- markdown content
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  total_duration INTERVAL DEFAULT '0 seconds',
  last_paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  UNIQUE(session_id, user_id)
);

CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  description TEXT
);

CREATE TABLE session_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  UNIQUE(session_id, label_id)
);

CREATE OR REPLACE FUNCTION start_session(
  p_github_issue_link TEXT,
  p_notes TEXT,
  p_participants UUID[],
  p_labels UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID = auth.uid();
  v_active_sessions TEXT[];
BEGIN
  -- Check if any participant has an active session
  SELECT array_agg(profiles.display_name)
  INTO v_active_sessions
  FROM auth.users
  JOIN profiles ON auth.users.id = profiles.id
  WHERE auth.users.id = ANY(p_participants)
  AND EXISTS (
    SELECT 1 FROM sessions ws
    JOIN session_participants wsp ON ws.id = wsp.session_id
    WHERE wsp.user_id = auth.users.id AND ws.status = 'active'
  );

  IF array_length(v_active_sessions, 1) > 0 THEN
    RAISE EXCEPTION 'The following users already have active sessions: %', array_to_string(v_active_sessions, ', ');
  END IF;

  -- Create the session
  INSERT INTO sessions (github_issue_link, notes, status, creator_id)
  VALUES (p_github_issue_link, p_notes, 'active', v_user_id)
  RETURNING id INTO v_session_id;

  -- Add participants (including creator who is the first participant)
  INSERT INTO session_participants (session_id, user_id)
  SELECT v_session_id, unnest(p_participants);

  -- Add labels if provided
  IF p_labels IS NOT NULL AND array_length(p_labels, 1) > 0 THEN
    INSERT INTO session_labels (session_id, label_id)
    SELECT v_session_id, unnest(p_labels);
  END IF;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION pause_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID = auth.uid();
  v_duration INTERVAL;
BEGIN
  -- Calculate duration since start or last unpause
  SELECT 
    CASE 
      WHEN last_paused_at IS NULL THEN now() - start_time 
      ELSE now() - last_paused_at + total_duration
    END
  INTO v_duration
  FROM sessions
  WHERE id = p_session_id AND status = 'active';

  -- Update session status and total_duration
  UPDATE sessions
  SET 
    status = 'paused',
    total_duration = v_duration,
    last_paused_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id AND status = 'active';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION resume_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID = auth.uid();
  v_active_sessions TEXT[];
  v_participants UUID[];
BEGIN
  -- Get all participants of this session
  SELECT array_agg(user_id)
  INTO v_participants
  FROM session_participants
  WHERE session_id = p_session_id;
  
  -- Check if any participant has another active session
  SELECT array_agg(profiles.display_name)
  INTO v_active_sessions
  FROM auth.users
  JOIN profiles ON auth.users.id = profiles.id
  WHERE auth.users.id = ANY(v_participants)
  AND EXISTS (
    SELECT 1 FROM sessions ws
    JOIN session_participants wsp ON ws.id = wsp.session_id
    WHERE wsp.user_id = auth.users.id 
    AND ws.status = 'active'
    AND ws.id <> p_session_id
  );

  IF array_length(v_active_sessions, 1) > 0 THEN
    RAISE EXCEPTION 'The following users already have active sessions: %', array_to_string(v_active_sessions, ', ');
  END IF;

  UPDATE sessions
  SET 
    status = 'active',
    last_paused_at = NULL,
    updated_at = NOW()
  WHERE id = p_session_id AND status = 'paused';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_duration INTERVAL;
BEGIN
  -- Calculate final duration
  SELECT 
    CASE 
      WHEN status = 'paused' THEN total_duration
      WHEN status = 'active' THEN 
        CASE
          WHEN last_paused_at IS NULL THEN now() - start_time
          ELSE now() - last_paused_at + total_duration
        END
    END
  INTO v_duration
  FROM sessions
  WHERE id = p_session_id AND status IN ('active', 'paused');

  -- Update session
  UPDATE sessions
  SET 
    status = 'completed',
    end_time = NOW(),
    total_duration = v_duration,
    updated_at = NOW()
  WHERE id = p_session_id AND status IN ('active', 'paused');

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE VIEW user_sessions AS
SELECT
  ws.*,
  wsp.user_id,
  p.display_name as participant_name,
  array_agg(DISTINCT l.name) as labels,
  CASE
    WHEN ws.status = 'active' THEN 
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(ws.last_paused_at, ws.start_time)) + ws.total_duration)/3600
    ELSE
      EXTRACT(EPOCH FROM ws.total_duration)/3600
  END as hours
FROM sessions ws
JOIN session_participants wsp ON ws.id = wsp.session_id
JOIN profiles p ON wsp.user_id = p.id
LEFT JOIN session_labels wsl ON ws.id = wsl.session_id
LEFT JOIN labels l ON wsl.label_id = l.id
GROUP BY ws.id, wsp.user_id, p.display_name;

CREATE VIEW dashboard_summary AS
SELECT
  u.display_name,
  l.name as label,
  DATE_TRUNC('day', ws.start_time) as day,
  DATE_TRUNC('week', ws.start_time) as week,
  DATE_TRUNC('month', ws.start_time) as month,
  EXTRACT(EPOCH FROM SUM(
    CASE
      WHEN ws.status = 'completed' THEN ws.total_duration
      WHEN ws.status = 'paused' THEN ws.total_duration
      WHEN ws.status = 'active' THEN 
        (CURRENT_TIMESTAMP - COALESCE(ws.last_paused_at, ws.start_time)) + ws.total_duration
    END
  ))/3600 as total_hours
FROM sessions ws
JOIN session_participants wsp ON ws.id = wsp.session_id
JOIN profiles u ON wsp.user_id = u.id
LEFT JOIN session_labels wsl ON ws.id = wsl.session_id
LEFT JOIN labels l ON wsl.label_id = l.id
GROUP BY u.display_name, l.name, day, week, month;

-- Only allow users to see sessions they participate in
CREATE POLICY "Users can view their own sessions"
ON sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_participants 
    WHERE session_id = sessions.id 
    AND user_id = auth.uid()
  )
);

-- Only allow users to update their active or paused sessions
CREATE POLICY "Users can update their non-completed sessions"
ON sessions FOR UPDATE
USING (
  creator_id = auth.uid() 
  AND status <> 'completed'
);

-- Allow updates to labels even for completed sessions
CREATE POLICY "Users can update session labels"
ON session_labels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sessions ws
    JOIN session_participants wsp ON ws.id = wsp.session_id
    WHERE ws.id = session_labels.session_id 
    AND wsp.user_id = auth.uid()
  )
);
