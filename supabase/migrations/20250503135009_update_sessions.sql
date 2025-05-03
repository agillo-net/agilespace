set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, github_username)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'user_name'
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.resume_session(p_session_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_non_completed_sessions TEXT[];
  v_participants UUID[];
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

CREATE OR REPLACE FUNCTION public.start_session(p_organization_id uuid, p_github_issue_link text, p_notes text, p_participants uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_session_id UUID;
  v_user_id UUID = auth.uid();
  v_non_completed_sessions TEXT[];
BEGIN
  -- Check if any participant has a non-completed session (active or paused)
  SELECT array_agg(profiles.display_name)
  INTO v_non_completed_sessions
  FROM auth.users
  JOIN profiles ON auth.users.id = profiles.id
  WHERE auth.users.id = ANY(p_participants)
  AND EXISTS (
    SELECT 1 FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE sp.user_id = auth.users.id AND s.status IN ('active', 'paused')
  );

  IF array_length(v_non_completed_sessions, 1) > 0 THEN
    RAISE EXCEPTION 'The following users already have non-completed sessions: %', array_to_string(v_non_completed_sessions, ', ');
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
$function$
;


