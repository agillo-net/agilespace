-- Notifications Schema
-- This schema manages in-app notifications for various events

-- =====================================================
-- ENUMS & TYPES
-- =====================================================

-- Notification types
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

-- Notification priority
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,

  -- Notification details
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Actor (who triggered this notification)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Related entity references (store as JSONB for flexibility)
  related_entity_type TEXT, -- e.g., 'time_off_request', 'issue', 'change_request'
  related_entity_id UUID,

  -- Action URL (where to navigate when clicked)
  action_url TEXT,

  -- Metadata for additional context
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional: auto-delete after expiry

  -- Constraints
  CONSTRAINT valid_read_at CHECK (
    (read = true AND read_at IS NOT NULL) OR
    (read = false AND read_at IS NULL)
  )
);

-- Notification preferences table (user settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,

  -- Preferences (what types of notifications to receive)
  enabled_types notification_type[] DEFAULT ARRAY[
    'time_off_requested',
    'time_off_approved',
    'time_off_rejected',
    'issue_assigned',
    'issue_mentioned',
    'change_request_review'
  ]::notification_type[],

  -- Email notifications
  email_enabled BOOLEAN DEFAULT false,
  email_digest_frequency TEXT CHECK (email_digest_frequency IN ('immediate', 'daily', 'weekly', 'never')) DEFAULT 'never',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one preference per user per space
  CONSTRAINT unique_user_space_preference UNIQUE (user_id, space_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_space_id ON notifications(space_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

-- Composite indexes for common queries
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_user_space ON notifications(user_id, space_id, created_at DESC);

-- Preference indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_space_id ON notification_preferences(space_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get unread notification count
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

-- Function to mark all notifications as read
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

-- Function to delete old notifications
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

-- Function to create a notification
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
$$ LANGUAGE plpgsql;

-- Function to notify space admins about time off requests
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Trigger to set read_at when read status changes
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

CREATE TRIGGER trigger_set_notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  WHEN (NEW.read IS DISTINCT FROM OLD.read)
  EXECUTE FUNCTION set_notification_read_at();

-- =====================================================
-- TIME OFF NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger to create notifications when time off is requested
CREATE OR REPLACE FUNCTION notify_time_off_requested()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_time_off_requested
  AFTER INSERT ON time_off_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_time_off_requested();

-- Trigger to create notifications when time off is approved
CREATE OR REPLACE FUNCTION notify_time_off_approved()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_time_off_approved
  AFTER UPDATE ON time_off_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'approved')
  EXECUTE FUNCTION notify_time_off_approved();

-- Trigger to create notifications when time off is rejected
CREATE OR REPLACE FUNCTION notify_time_off_rejected()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_time_off_rejected
  AFTER UPDATE ON time_off_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'rejected')
  EXECUTE FUNCTION notify_time_off_rejected();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read/unread)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications (for triggers and functions)
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Enable RLS on notification_preferences table
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE notifications IS 'Stores in-app notifications for various events';
COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';
COMMENT ON COLUMN notifications.metadata IS 'Flexible JSONB field for additional notification context';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration date for auto-deletion';
COMMENT ON FUNCTION get_unread_notification_count IS 'Gets count of unread notifications for a user';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marks all unread notifications as read for a user';
COMMENT ON FUNCTION delete_old_notifications IS 'Deletes notifications older than specified days';
COMMENT ON FUNCTION create_notification IS 'Creates a new notification with preference checking';
COMMENT ON FUNCTION notify_space_admins IS 'Sends notification to all admins/owners of a space';
