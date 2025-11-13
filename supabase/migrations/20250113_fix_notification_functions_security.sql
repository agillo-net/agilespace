-- Fix notification functions to use SECURITY DEFINER
-- This allows triggers to bypass RLS when creating notifications

-- Update create_notification function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_space_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_priority notification_priority DEFAULT 'medium',
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key change
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_user_preferences RECORD;
BEGIN
  -- Check if user has this notification type enabled
  SELECT * INTO v_user_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id
    AND (p_space_id IS NULL OR space_id = p_space_id)
  LIMIT 1;

  -- If preferences exist and type is not enabled, don't create notification
  IF v_user_preferences IS NOT NULL AND NOT (p_type = ANY(v_user_preferences.enabled_types)) THEN
    RETURN NULL;
  END IF;

  -- Create the notification
  INSERT INTO notifications (
    user_id,
    space_id,
    type,
    priority,
    title,
    message,
    actor_id,
    related_entity_type,
    related_entity_id,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_space_id,
    p_type,
    p_priority,
    p_title,
    p_message,
    p_actor_id,
    p_related_entity_type,
    p_related_entity_id,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Update notify_space_admins function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_space_admins(
  p_space_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key change
SET search_path = public
AS $$
DECLARE
  v_admin_record RECORD;
  v_notification_count INTEGER := 0;
BEGIN
  -- Get all space admins
  FOR v_admin_record IN
    SELECT DISTINCT sm.user_id
    FROM space_members sm
    WHERE sm.space_id = p_space_id
      AND sm.role = 'admin'
      AND sm.user_id != p_actor_id -- Don't notify the actor
  LOOP
    -- Create notification for each admin
    PERFORM create_notification(
      v_admin_record.user_id,
      p_type,
      p_title,
      p_message,
      p_space_id,
      p_actor_id,
      'medium'::notification_priority,
      p_related_entity_type,
      p_related_entity_id,
      p_action_url,
      p_metadata
    );
    v_notification_count := v_notification_count + 1;
  END LOOP;

  RETURN v_notification_count;
END;
$$;

-- Update notify_time_off_requested function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_time_off_requested()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key change
SET search_path = public
AS $$
DECLARE
  v_requester_name TEXT;
  v_space_name TEXT;
BEGIN
  -- Get requester name
  SELECT full_name INTO v_requester_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get space name
  SELECT name INTO v_space_name
  FROM spaces
  WHERE id = NEW.space_id;

  -- Notify space admins
  PERFORM notify_space_admins(
    NEW.space_id,
    'time_off_requested'::notification_type,
    'New Time Off Request',
    v_requester_name || ' has requested time off from ' ||
    TO_CHAR(NEW.start_date, 'Mon DD') || ' to ' ||
    TO_CHAR(NEW.end_date, 'Mon DD, YYYY'),
    NEW.user_id,
    'time_off_request',
    NEW.id,
    '/space/' || (SELECT slug FROM spaces WHERE id = NEW.space_id) || '/time-off',
    jsonb_build_object(
      'type', NEW.type,
      'total_days', NEW.total_days,
      'space_name', v_space_name
    )
  );

  RETURN NEW;
END;
$$;

-- Update notify_time_off_approved function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_time_off_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key change
SET search_path = public
AS $$
DECLARE
  v_reviewer_name TEXT;
  v_space_name TEXT;
BEGIN
  -- Get reviewer name
  SELECT full_name INTO v_reviewer_name
  FROM profiles
  WHERE id = NEW.reviewed_by;

  -- Get space name
  SELECT name INTO v_space_name
  FROM spaces
  WHERE id = NEW.space_id;

  -- Notify the requester
  PERFORM create_notification(
    NEW.user_id,
    'time_off_approved'::notification_type,
    'Time Off Approved',
    'Your time off request from ' ||
    TO_CHAR(NEW.start_date, 'Mon DD') || ' to ' ||
    TO_CHAR(NEW.end_date, 'Mon DD, YYYY') || ' has been approved' ||
    CASE WHEN v_reviewer_name IS NOT NULL THEN ' by ' || v_reviewer_name ELSE '' END,
    NEW.space_id,
    NEW.reviewed_by,
    'high'::notification_priority,
    'time_off_request',
    NEW.id,
    '/space/' || (SELECT slug FROM spaces WHERE id = NEW.space_id) || '/time-off',
    jsonb_build_object(
      'type', NEW.type,
      'total_days', NEW.total_days,
      'space_name', v_space_name,
      'reviewer_notes', NEW.reviewer_notes
    )
  );

  RETURN NEW;
END;
$$;

-- Update notify_time_off_rejected function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_time_off_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This is the key change
SET search_path = public
AS $$
DECLARE
  v_reviewer_name TEXT;
  v_space_name TEXT;
BEGIN
  -- Get reviewer name
  SELECT full_name INTO v_reviewer_name
  FROM profiles
  WHERE id = NEW.reviewed_by;

  -- Get space name
  SELECT name INTO v_space_name
  FROM spaces
  WHERE id = NEW.space_id;

  -- Notify the requester
  PERFORM create_notification(
    NEW.user_id,
    'time_off_rejected'::notification_type,
    'Time Off Rejected',
    'Your time off request from ' ||
    TO_CHAR(NEW.start_date, 'Mon DD') || ' to ' ||
    TO_CHAR(NEW.end_date, 'Mon DD, YYYY') || ' has been rejected' ||
    CASE WHEN v_reviewer_name IS NOT NULL THEN ' by ' || v_reviewer_name ELSE '' END,
    NEW.space_id,
    NEW.reviewed_by,
    'high'::notification_priority,
    'time_off_request',
    NEW.id,
    '/space/' || (SELECT slug FROM spaces WHERE id = NEW.space_id) || '/time-off',
    jsonb_build_object(
      'type', NEW.type,
      'total_days', NEW.total_days,
      'space_name', v_space_name,
      'reviewer_notes', NEW.reviewer_notes
    )
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_notification IS 'Creates a new notification with preference checking (SECURITY DEFINER allows bypassing RLS)';
COMMENT ON FUNCTION notify_space_admins IS 'Sends notification to all admins/owners of a space (SECURITY DEFINER allows bypassing RLS)';
COMMENT ON FUNCTION notify_time_off_requested IS 'Trigger function to notify admins of new time off requests (SECURITY DEFINER allows bypassing RLS)';
COMMENT ON FUNCTION notify_time_off_approved IS 'Trigger function to notify users of approved time off (SECURITY DEFINER allows bypassing RLS)';
COMMENT ON FUNCTION notify_time_off_rejected IS 'Trigger function to notify users of rejected time off (SECURITY DEFINER allows bypassing RLS)';
