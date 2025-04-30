-- Sessions table for work sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  github_issue_link TEXT NOT NULL,
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

-- Session participants table
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  UNIQUE(session_id, user_id)
);

-- Function to start a new session
CREATE OR REPLACE FUNCTION start_session(
  p_organization_id UUID,
  p_github_issue_link TEXT,
  p_notes TEXT,
  p_participants UUID[]
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
    SELECT 1 FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE sp.user_id = auth.users.id AND s.status = 'active'
  );

  IF array_length(v_active_sessions, 1) > 0 THEN
    RAISE EXCEPTION 'The following users already have active sessions: %', array_to_string(v_active_sessions, ', ');
  END IF;

  -- Create the session
  INSERT INTO sessions (organization_id, github_issue_link, notes, status, creator_id)
  VALUES (p_organization_id, p_github_issue_link, p_notes, 'active', v_user_id)
  RETURNING id INTO v_session_id;

  -- Add participants (including creator who is the first participant)
  INSERT INTO session_participants (session_id, user_id)
  SELECT v_session_id, unnest(p_participants);

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to pause a session
CREATE OR REPLACE FUNCTION pause_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
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

-- Function to resume a session
CREATE OR REPLACE FUNCTION resume_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
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
    SELECT 1 FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE sp.user_id = auth.users.id 
    AND s.status = 'active'
    AND s.id <> p_session_id
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

-- Function to complete a session
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

-- Policies for sessions
CREATE POLICY "Users can view sessions they participate in"
ON sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_participants 
    WHERE session_id = sessions.id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their non-completed sessions"
ON sessions FOR UPDATE
USING (
  creator_id = auth.uid() 
  AND status <> 'completed'
);

CREATE POLICY "Users can manage session participants"
ON session_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE id = session_participants.session_id 
    AND creator_id = auth.uid()
  )
);
