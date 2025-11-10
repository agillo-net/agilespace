-- Time Off Management Schema
-- This schema manages time off requests, approvals, and team calendar

-- =====================================================
-- ENUMS & TYPES
-- =====================================================

-- Time off request types
CREATE TYPE time_off_type AS ENUM (
  'vacation',
  'sick_leave',
  'personal',
  'unpaid',
  'other'
);

-- Time off request status
CREATE TYPE time_off_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

-- =====================================================
-- TABLES
-- =====================================================

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
  total_days NUMERIC(4, 2) NOT NULL, -- Calculated: can be 0.5, 1, 1.5, etc.

  -- Description
  reason TEXT,
  notes TEXT, -- Additional notes from requester

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
-- INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX idx_time_off_requests_space_id ON time_off_requests(space_id);
CREATE INDEX idx_time_off_requests_user_id ON time_off_requests(user_id);
CREATE INDEX idx_time_off_requests_space_member_id ON time_off_requests(space_member_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_requests_dates ON time_off_requests(start_date, end_date);
CREATE INDEX idx_time_off_requests_reviewed_by ON time_off_requests(reviewed_by);

-- Composite index for common queries
CREATE INDEX idx_time_off_requests_space_status ON time_off_requests(space_id, status);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate business days between two dates
-- This is a simple implementation; you can enhance it to exclude holidays
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
  -- If half day, return 0.5
  IF p_is_half_day THEN
    RETURN 0.5;
  END IF;

  -- Calculate total days including start and end date
  v_days := 0;
  v_current_date := p_start_date;

  WHILE v_current_date <= p_end_date LOOP
    -- Count only weekdays (Monday=1 to Friday=5)
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
    AND (
      -- Check for date overlap
      (tor.start_date <= p_end_date AND tor.end_date >= p_start_date)
    );
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
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_off_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_time_off_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_updated_at();

-- Trigger to auto-calculate total_days if not provided
CREATE OR REPLACE FUNCTION calculate_total_days_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if total_days is not explicitly set or is 0
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

CREATE TRIGGER trigger_set_reviewed_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION set_reviewed_at_trigger();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE time_off_requests IS 'Stores time off requests with approval workflow';
COMMENT ON COLUMN time_off_requests.is_half_day IS 'Whether this is a half-day request';
COMMENT ON COLUMN time_off_requests.half_day_period IS 'Morning or afternoon (only for half-day requests)';
COMMENT ON COLUMN time_off_requests.total_days IS 'Total business days (excluding weekends), can be 0.5 for half days';
COMMENT ON FUNCTION calculate_time_off_days IS 'Calculates business days between two dates, excluding weekends';
COMMENT ON FUNCTION check_time_off_conflicts IS 'Checks for overlapping time off requests for a member';
COMMENT ON FUNCTION get_team_time_off IS 'Gets all team time off for a date range with member details';
