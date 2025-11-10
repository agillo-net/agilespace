-- =====================================================
-- TIME OFF FEATURE - CONSOLIDATED MIGRATION
-- =====================================================
-- Run this entire file in your Supabase SQL Editor
-- This includes: permissions updates, RLS policies, and time off schema

-- =====================================================
-- STEP 1: UPDATE PERMISSIONS CATEGORY
-- =====================================================

-- Update the category check constraint to include 'time_off'
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_category_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_category_check
  CHECK (category IN ('space', 'members', 'issues', 'prs', 'change_requests', 'repos', 'analytics', 'time_off'));

-- =====================================================
-- STEP 2: ADD TIME OFF PERMISSIONS
-- =====================================================

-- Insert time off permissions
INSERT INTO permissions (name, description, category) VALUES
  ('time_off:view', 'View time off requests', 'time_off'),
  ('time_off:create', 'Create time off requests', 'time_off'),
  ('time_off:update_own', 'Update own time off requests', 'time_off'),
  ('time_off:delete_own', 'Delete own time off requests', 'time_off'),
  ('time_off:approve', 'Approve or reject time off requests', 'time_off'),
  ('time_off:delete_all', 'Delete all time off requests', 'time_off')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 3: ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Admin role gets all time off permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE category = 'time_off'
ON CONFLICT DO NOTHING;

-- Member role gets view, create, update_own, delete_own
INSERT INTO role_permissions (role, permission_id)
SELECT 'member', id FROM permissions WHERE name IN (
  'time_off:view',
  'time_off:create',
  'time_off:update_own',
  'time_off:delete_own'
)
ON CONFLICT DO NOTHING;

-- Observer role gets only view permission
INSERT INTO role_permissions (role, permission_id)
SELECT 'observer', id FROM permissions WHERE name = 'time_off:view'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: CREATE TIME OFF TABLES & TYPES
-- =====================================================

-- Time off request types
DO $$ BEGIN
  CREATE TYPE time_off_type AS ENUM (
    'vacation',
    'sick_leave',
    'personal',
    'unpaid',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Time off request status
DO $$ BEGIN
  CREATE TYPE time_off_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Time Off Requests table
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_member_id UUID NOT NULL REFERENCES space_members(id) ON DELETE CASCADE,

  -- Request details
  type time_off_type NOT NULL DEFAULT 'vacation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_half_day BOOLEAN DEFAULT false,
  half_day_period TEXT CHECK (half_day_period IN ('morning', 'afternoon', NULL)),
  total_days NUMERIC(4, 2) NOT NULL,

  -- Description
  reason TEXT,
  notes TEXT,

  -- Status & workflow
  status time_off_status NOT NULL DEFAULT 'pending',

  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Review details
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_half_day CHECK (
    (is_half_day = true AND half_day_period IS NOT NULL AND start_date = end_date) OR
    (is_half_day = false AND half_day_period IS NULL)
  ),
  CONSTRAINT valid_total_days CHECK (total_days > 0)
);

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_time_off_requests_space_id ON time_off_requests(space_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_user_id ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_space_member_id ON time_off_requests(space_member_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON time_off_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_reviewed_by ON time_off_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_space_status ON time_off_requests(space_id, status);

-- =====================================================
-- STEP 6: CREATE FUNCTIONS
-- =====================================================

-- Function to calculate business days between two dates
CREATE OR REPLACE FUNCTION calculate_time_off_days(
  p_start_date DATE,
  p_end_date DATE,
  p_is_half_day BOOLEAN DEFAULT false
)
RETURNS NUMERIC AS $$
DECLARE
  v_days NUMERIC;
  v_current_date DATE;
BEGIN
  IF p_is_half_day THEN
    RETURN 0.5;
  END IF;

  v_days := 0;
  v_current_date := p_start_date;

  WHILE v_current_date <= p_end_date LOOP
    IF EXTRACT(ISODOW FROM v_current_date) BETWEEN 1 AND 5 THEN
      v_days := v_days + 1;
    END IF;
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;

  RETURN v_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check for conflicting time off requests
CREATE OR REPLACE FUNCTION check_time_off_conflicts(
  p_space_member_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_request_id UUID DEFAULT NULL
)
RETURNS TABLE (
  request_id UUID,
  start_date DATE,
  end_date DATE,
  status time_off_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tor.id,
    tor.start_date,
    tor.end_date,
    tor.status
  FROM time_off_requests tor
  WHERE tor.space_member_id = p_space_member_id
    AND tor.status IN ('pending', 'approved')
    AND (tor.id != p_exclude_request_id OR p_exclude_request_id IS NULL)
    AND (tor.start_date <= p_end_date AND tor.end_date >= p_start_date);
END;
$$ LANGUAGE plpgsql;

-- Function to get team time off for a date range
CREATE OR REPLACE FUNCTION get_team_time_off(
  p_space_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_status_filter time_off_status[] DEFAULT ARRAY['approved']::time_off_status[]
)
RETURNS TABLE (
  id UUID,
  space_member_id UUID,
  member_name TEXT,
  avatar_url TEXT,
  start_date DATE,
  end_date DATE,
  type time_off_type,
  status time_off_status,
  is_half_day BOOLEAN,
  total_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tor.id,
    tor.space_member_id,
    p.full_name as member_name,
    p.avatar_url,
    tor.start_date,
    tor.end_date,
    tor.type,
    tor.status,
    tor.is_half_day,
    tor.total_days
  FROM time_off_requests tor
  JOIN space_members sm ON tor.space_member_id = sm.id
  JOIN profiles p ON sm.user_id = p.id
  WHERE tor.space_id = p_space_id
    AND tor.status = ANY(p_status_filter)
    AND tor.start_date <= p_end_date
    AND tor.end_date >= p_start_date
  ORDER BY tor.start_date ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_off_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_time_off_updated_at ON time_off_requests;
CREATE TRIGGER trigger_update_time_off_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_updated_at();

-- Trigger to auto-calculate total_days if not provided
CREATE OR REPLACE FUNCTION calculate_total_days_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_days IS NULL OR NEW.total_days = 0 THEN
    NEW.total_days := calculate_time_off_days(
      NEW.start_date,
      NEW.end_date,
      NEW.is_half_day
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_total_days ON time_off_requests;
CREATE TRIGGER trigger_calculate_total_days
  BEFORE INSERT OR UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_days_trigger();

-- Trigger to set reviewed_at when status changes to approved/rejected
CREATE OR REPLACE FUNCTION set_reviewed_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    NEW.reviewed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_reviewed_at ON time_off_requests;
CREATE TRIGGER trigger_set_reviewed_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION set_reviewed_at_trigger();

-- =====================================================
-- STEP 8: ENABLE RLS AND CREATE POLICIES
-- =====================================================

ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Space members can view time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Members can create time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Users can update time off requests" ON time_off_requests;
DROP POLICY IF EXISTS "Users can delete time off requests" ON time_off_requests;

-- Space members can view time off requests in their space
CREATE POLICY "Space members can view time off requests"
  ON time_off_requests FOR SELECT
  TO authenticated
  USING (
    user_has_permission(auth.uid(), space_id, 'time_off:view')
  );

-- Members can create their own time off requests
CREATE POLICY "Members can create time off requests"
  ON time_off_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND user_has_permission(auth.uid(), space_id, 'time_off:create')
  );

-- Users can update their own pending requests, admins can update all
CREATE POLICY "Users can update time off requests"
  ON time_off_requests FOR UPDATE
  TO authenticated
  USING (
    user_has_permission(auth.uid(), space_id, 'time_off:approve')
    OR (
      user_id = auth.uid()
      AND status = 'pending'
      AND user_has_permission(auth.uid(), space_id, 'time_off:update_own')
    )
  );

-- Users can delete their own pending requests, admins can delete all
CREATE POLICY "Users can delete time off requests"
  ON time_off_requests FOR DELETE
  TO authenticated
  USING (
    user_has_permission(auth.uid(), space_id, 'time_off:delete_all')
    OR (
      user_id = auth.uid()
      AND status = 'pending'
      AND user_has_permission(auth.uid(), space_id, 'time_off:delete_own')
    )
  );

-- =====================================================
-- STEP 9: ADD COMMENTS
-- =====================================================

COMMENT ON TABLE time_off_requests IS 'Stores time off requests with approval workflow';
COMMENT ON COLUMN time_off_requests.is_half_day IS 'Whether this is a half-day request';
COMMENT ON COLUMN time_off_requests.half_day_period IS 'Morning or afternoon (only for half-day requests)';
COMMENT ON COLUMN time_off_requests.total_days IS 'Total business days (excluding weekends), can be 0.5 for half days';
COMMENT ON FUNCTION calculate_time_off_days IS 'Calculates business days between two dates, excluding weekends';
COMMENT ON FUNCTION check_time_off_conflicts IS 'Checks for overlapping time off requests for a member';
COMMENT ON FUNCTION get_team_time_off IS 'Gets all team time off for a date range with member details';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- You can now use the time off feature!
-- Remember to run: npm run db:types
