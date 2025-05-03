set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.resume_session(p_session_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_non_completed_sessions TEXT[];
  v_participants UUID[];
  v_total_duration INTERVAL;
BEGIN
  -- Get all participants of this session
  SELECT array_agg(user_id)
  INTO v_participants
  FROM session_participants
  WHERE session_id = p_session_id;
  
  -- Check if any participant has another non-completed session
  SELECT array_agg(profiles.display_name)
  INTO v_non_completed_sessions
  FROM auth.users
  JOIN profiles ON auth.users.id = profiles.id
  WHERE auth.users.id = ANY(v_participants)
  AND EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE sp.user_id = auth.users.id 
    AND s.status IN ('active', 'paused')
    AND s.id <> p_session_id
  );

  IF array_length(v_non_completed_sessions, 1) > 0 THEN
    RAISE EXCEPTION 'The following users already have non-completed sessions: %', array_to_string(v_non_completed_sessions, ', ');
  END IF;

  -- Get current total_duration
  SELECT total_duration INTO v_total_duration
  FROM sessions
  WHERE id = p_session_id AND status = 'paused';

  -- Update session: 
  -- 1. Set status to active
  -- 2. Adjust start_time to account for accumulated duration
  -- 3. Clear last_paused_at
  UPDATE sessions
  SET 
    status = 'active',
    last_paused_at = NULL,
    updated_at = NOW()
  WHERE id = p_session_id AND status = 'paused';

  RETURN FOUND;
END;
$function$
;


