-- =====================================================
-- SAFE PRODUCTION MIGRATION FOR NOTIFICATIONS
-- =====================================================
-- This script safely adds notifications to production without losing data
-- Run this in Supabase Dashboard SQL Editor

-- =====================================================
-- STEP 1: CREATE ENUMS (Skip if already exist)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'time_off_requested',
    'time_off_approved',
    'time_off_rejected',
    'time_off_cancelled',
    'member_joined',
    'member_left',
    'issue_assigned',
    'issue_mentioned',
    'change_request_review',
    'change_request_approved',
    'change_request_rejected',
    'system_announcement',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- STEP 2: CREATE TABLES (Only if they don't exist)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_read_at CHECK (
    (read = true AND read_at IS NOT NULL) OR
    (read = false AND read_at IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  enabled_types notification_type[] DEFAULT ARRAY[
    'time_off_requested',
    'time_off_approved',
    'time_off_rejected',
    'issue_assigned',
    'issue_mentioned',
    'change_request_review'
  ]::notification_type[],
  email_enabled BOOLEAN DEFAULT false,
  email_digest_frequency TEXT CHECK (email_digest_frequency IN ('immediate', 'daily', 'weekly', 'never')) DEFAULT 'never',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_space_preference UNIQUE (user_id, space_id)
);

-- =====================================================
-- STEP 3: CREATE INDEXES (Skip if already exist)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_space_id ON notifications(space_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_space ON notifications(user_id, space_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_space_id ON notification_preferences(space_id);

-- =====================================================
-- STEP 4: CREATE/UPDATE FUNCTIONS (Always safe)
-- =====================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_user_id UUID,
  p_space_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND read = false
    AND (p_space_id IS NULL OR space_id = p_space_id)
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id UUID,
  p_space_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET
    read = true,
    read_at = NOW()
  WHERE user_id = p_user_id
    AND read = false
    AND (p_space_id IS NULL OR space_id = p_space_id)
    AND (expires_at IS NULL OR expires_at > NOW());

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_old_notifications(
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
    OR (expires_at IS NOT NULL AND expires_at < NOW());

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

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
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_user_preferences RECORD;
BEGIN
  SELECT * INTO v_user_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id
    AND (p_space_id IS NULL OR space_id = p_space_id)
  LIMIT 1;

  IF v_user_preferences IS NOT NULL AND NOT (p_type = ANY(v_user_preferences.enabled_types)) THEN
    RETURN NULL;
  END IF;

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
$$ LANGUAGE plpgsql;

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
RETURNS INTEGER AS $$
DECLARE
  v_admin_record RECORD;
  v_notification_count INTEGER := 0;
BEGIN
  FOR v_admin_record IN
    SELECT DISTINCT sm.user_id
    FROM space_members sm
    WHERE sm.space_id = p_space_id
      AND sm.role = 'admin'
      AND sm.user_id != p_actor_id
  LOOP
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: CREATE TRIGGERS (Safe to recreate)
-- =====================================================

-- Create function first, then the trigger that uses it
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

DROP TRIGGER IF EXISTS trigger_set_notification_read_at ON notifications;
CREATE TRIGGER trigger_set_notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  WHEN (NEW.read IS DISTINCT FROM OLD.read)
  EXECUTE FUNCTION set_notification_read_at();

CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at := NOW();
  ELSIF NEW.read = false AND OLD.read = true THEN
    NEW.read_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: TIME OFF TRIGGERS (Safe to recreate)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_notify_time_off_requested ON time_off_requests;
CREATE TRIGGER trigger_notify_time_off_requested
  AFTER INSERT ON time_off_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_time_off_requested();

CREATE OR REPLACE FUNCTION notify_time_off_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_requester_name TEXT;
  v_space_name TEXT;
BEGIN
  SELECT full_name INTO v_requester_name
  FROM profiles
  WHERE id = NEW.user_id;

  SELECT name INTO v_space_name
  FROM spaces
  WHERE id = NEW.space_id;

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_time_off_approved ON time_off_requests;
CREATE TRIGGER trigger_notify_time_off_approved
  AFTER UPDATE ON time_off_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'approved')
  EXECUTE FUNCTION notify_time_off_approved();

CREATE OR REPLACE FUNCTION notify_time_off_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name TEXT;
  v_space_name TEXT;
BEGIN
  SELECT full_name INTO v_reviewer_name
  FROM profiles
  WHERE id = NEW.reviewed_by;

  SELECT name INTO v_space_name
  FROM spaces
  WHERE id = NEW.space_id;

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_time_off_rejected ON time_off_requests;
CREATE TRIGGER trigger_notify_time_off_rejected
  AFTER UPDATE ON time_off_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'rejected')
  EXECUTE FUNCTION notify_time_off_rejected();

CREATE OR REPLACE FUNCTION notify_time_off_rejected()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name TEXT;
  v_space_name TEXT;
BEGIN
  SELECT full_name INTO v_reviewer_name
  FROM profiles
  WHERE id = NEW.reviewed_by;

  SELECT name INTO v_space_name
  FROM spaces
  WHERE id = NEW.space_id;

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
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: ENABLE RLS (Safe to run multiple times)
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;

-- Create policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 8: ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
