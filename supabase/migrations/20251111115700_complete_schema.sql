create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text,
  github_id bigint unique,
  avatar_url text,
  full_name text,
  created_at timestamp with time zone default now()
);
-- =====================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- =====================================================
-- This trigger automatically creates a profile when a new user signs up via GitHub

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (
    id,
    full_name,
    github_username,
    github_id,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'preferred_username', 'Unknown User'),
    NEW.raw_user_meta_data->>'preferred_username',
    (NEW.raw_user_meta_data->>'provider_id')::bigint,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    github_username = COALESCE(EXCLUDED.github_username, profiles.github_username),
    github_id = COALESCE(EXCLUDED.github_id, profiles.github_id),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- PROFILE UPDATE TRIGGER
-- =====================================================
-- This trigger updates profile when user metadata changes

CREATE OR REPLACE FUNCTION handle_user_metadata_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile if user metadata has changed
  IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    UPDATE public.profiles SET
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
      github_username = COALESCE(NEW.raw_user_meta_data->>'preferred_username', profiles.github_username),
      github_id = COALESCE((NEW.raw_user_meta_data->>'provider_id')::bigint, profiles.github_id),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', profiles.avatar_url)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create trigger that fires when user metadata is updated
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_metadata_update();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profile when a new user signs up via GitHub OAuth';
COMMENT ON FUNCTION handle_user_metadata_update IS 'Automatically updates profile when user metadata changes (e.g., GitHub info update)';
create table spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  avatar_url text,
  plan text default 'free',
  github_org_id bigint,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('admin', 'member', 'observer')) not null,
  nickname text,
  status text check (status in ('online', 'offline')) default 'offline',
  location text check (location in ('office', 'remote')) default null,
  joined_at timestamp with time zone default now(),
  last_active_at timestamp with time zone,
  last_status_update_at timestamp with time zone default now()
);
create table tracks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  issue_number integer not null,
  title text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),

  unique (space_id, repo_owner, repo_name, issue_number)
);
create table sessions (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id) on delete cascade,
  space_member_id uuid references space_members(id) on delete cascade,
  comment_url text default null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  skipped_summary boolean default false
);
create table tags (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamp with time zone default now(),

  unique (space_id, name)
);

create table session_tags (
  session_id uuid references sessions(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,

  primary key (session_id, tag_id)
);
-- =====================================================
-- PERMISSIONS SYSTEM
-- =====================================================
-- This schema implements a flexible role-based access control (RBAC) system
-- with support for space-specific permission overrides.

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
-- Stores all available permissions in the system
create table permissions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  category text not null check (category in ('space', 'members', 'issues', 'prs', 'change_requests', 'repos', 'analytics', 'time_off')),
  created_at timestamp with time zone default now()
);

-- Index for faster permission lookups
create index idx_permissions_name on permissions(name);
create index idx_permissions_category on permissions(category);

-- =====================================================
-- ROLE PERMISSIONS TABLE
-- =====================================================
-- Maps permissions to roles (admin, member, observer)
create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin', 'member', 'observer')),
  permission_id uuid references permissions(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(role, permission_id)
);

-- Index for faster role permission lookups
create index idx_role_permissions_role on role_permissions(role);
create index idx_role_permissions_permission_id on role_permissions(permission_id);

-- =====================================================
-- SPACE MEMBER PERMISSION OVERRIDES TABLE
-- =====================================================
-- Allows granting or revoking specific permissions for individual space members
-- This overrides the default role permissions
create table space_member_permissions (
  id uuid primary key default gen_random_uuid(),
  space_member_id uuid references space_members(id) on delete cascade not null,
  permission_id uuid references permissions(id) on delete cascade not null,
  granted boolean default true not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamp with time zone default now(),
  unique(space_member_id, permission_id)
);

-- Index for faster permission override lookups
create index idx_space_member_permissions_space_member_id on space_member_permissions(space_member_id);
create index idx_space_member_permissions_permission_id on space_member_permissions(permission_id);

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================
insert into permissions (name, description, category) values
  -- Space permissions
  ('space:view', 'View space details', 'space'),
  ('space:update', 'Update space settings', 'space'),
  ('space:delete', 'Delete space', 'space'),
  ('space:manage_settings', 'Manage space settings and integrations', 'space'),

  -- Member permissions
  ('members:view', 'View space members', 'members'),
  ('members:invite', 'Invite new members to the space', 'members'),
  ('members:remove', 'Remove members from the space', 'members'),
  ('members:update_roles', 'Update member roles', 'members'),
  ('members:update_own_profile', 'Update own profile (nickname, status, location)', 'members'),

  -- Issue permissions
  ('issues:view', 'View issues', 'issues'),
  ('issues:create', 'Create new issues', 'issues'),
  ('issues:update_own', 'Update own issues', 'issues'),
  ('issues:update_all', 'Update all issues in the space', 'issues'),
  ('issues:delete_own', 'Delete own issues', 'issues'),
  ('issues:delete_all', 'Delete all issues in the space', 'issues'),

  -- Pull request permissions
  ('prs:view', 'View pull requests', 'prs'),
  ('prs:create', 'Create pull requests', 'prs'),
  ('prs:update_own', 'Update own pull requests', 'prs'),
  ('prs:update_all', 'Update all pull requests', 'prs'),
  ('prs:delete_own', 'Delete own pull requests', 'prs'),
  ('prs:delete_all', 'Delete all pull requests', 'prs'),

  -- Change request permissions
  ('change_requests:view', 'View change requests', 'change_requests'),
  ('change_requests:create', 'Create change requests', 'change_requests'),
  ('change_requests:update_own', 'Update own change requests', 'change_requests'),
  ('change_requests:update_all', 'Update all change requests', 'change_requests'),
  ('change_requests:delete_own', 'Delete own change requests', 'change_requests'),
  ('change_requests:delete_all', 'Delete all change requests', 'change_requests'),

  -- Repository permissions
  ('repos:view', 'View repositories', 'repos'),
  ('repos:manage', 'Manage repository connections', 'repos'),

  -- Analytics permissions
  ('analytics:view_own', 'View own analytics', 'analytics'),
  ('analytics:view_team', 'View team analytics', 'analytics'),
  ('analytics:export', 'Export analytics data', 'analytics'),

  -- Time off permissions
  ('time_off:view', 'View time off requests', 'time_off'),
  ('time_off:create', 'Create time off requests', 'time_off'),
  ('time_off:update_own', 'Update own time off requests', 'time_off'),
  ('time_off:delete_own', 'Delete own time off requests', 'time_off'),
  ('time_off:approve', 'Approve or reject time off requests', 'time_off'),
  ('time_off:delete_all', 'Delete all time off requests', 'time_off');

-- =====================================================
-- SEED ADMIN ROLE PERMISSIONS (Full Access)
-- =====================================================
insert into role_permissions (role, permission_id)
select 'admin', id from permissions;

-- =====================================================
-- SEED MEMBER ROLE PERMISSIONS
-- =====================================================
insert into role_permissions (role, permission_id)
select 'member', id from permissions where name in (
  -- Space
  'space:view',

  -- Members
  'members:view',
  'members:update_own_profile',

  -- Issues
  'issues:view',
  'issues:create',
  'issues:update_own',
  'issues:delete_own',

  -- Pull Requests
  'prs:view',
  'prs:create',
  'prs:update_own',
  'prs:delete_own',

  -- Change Requests
  'change_requests:view',
  'change_requests:create',
  'change_requests:update_own',
  'change_requests:delete_own',

  -- Repositories
  'repos:view',

  -- Analytics
  'analytics:view_own',
  'analytics:view_team',

  -- Time Off
  'time_off:view',
  'time_off:create',
  'time_off:update_own',
  'time_off:delete_own'
);

-- =====================================================
-- SEED OBSERVER ROLE PERMISSIONS (Read-Only)
-- =====================================================
insert into role_permissions (role, permission_id)
select 'observer', id from permissions where name in (
  -- Space
  'space:view',

  -- Members
  'members:view',
  'members:update_own_profile',

  -- Content (read-only)
  'issues:view',
  'prs:view',
  'change_requests:view',
  'repos:view',

  -- Analytics (read-only)
  'analytics:view_own',
  'analytics:view_team',

  -- Time Off (read-only)
  'time_off:view'
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user has a specific permission in a space
create or replace function user_has_permission(
  p_user_id uuid,
  p_space_id uuid,
  p_permission_name text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_space_member_id uuid;
  v_role text;
  v_has_role_permission boolean;
  v_override_record record;
begin
  -- Get the user's space membership
  select id, role into v_space_member_id, v_role
  from space_members
  where user_id = p_user_id and space_id = p_space_id;

  -- If not a member, return false
  if v_space_member_id is null then
    return false;
  end if;

  -- Check for permission override first
  select granted into v_override_record
  from space_member_permissions smp
  join permissions p on p.id = smp.permission_id
  where smp.space_member_id = v_space_member_id
    and p.name = p_permission_name;

  -- If there's an override, use it
  if found then
    return v_override_record.granted;
  end if;

  -- Otherwise, check role permissions
  select exists(
    select 1
    from role_permissions rp
    join permissions p on p.id = rp.permission_id
    where rp.role = v_role
      and p.name = p_permission_name
  ) into v_has_role_permission;

  return v_has_role_permission;
end;
$$;

-- Function to get all permissions for a user in a space
create or replace function get_user_permissions(
  p_user_id uuid,
  p_space_id uuid
)
returns table(permission_name text, granted boolean)
language plpgsql
security definer
as $$
declare
  v_space_member_id uuid;
  v_role text;
begin
  -- Get the user's space membership
  select id, role into v_space_member_id, v_role
  from space_members
  where user_id = p_user_id and space_id = p_space_id;

  -- If not a member, return empty
  if v_space_member_id is null then
    return;
  end if;

  -- Return role permissions with overrides applied
  return query
  select
    p.name as permission_name,
    coalesce(smp.granted, true) as granted
  from role_permissions rp
  join permissions p on p.id = rp.permission_id
  left join space_member_permissions smp on smp.permission_id = p.id
    and smp.space_member_id = v_space_member_id
  where rp.role = v_role;
end;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on permissions tables
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table space_member_permissions enable row level security;

-- Permissions table: All authenticated users can view
create policy "Anyone can view permissions"
  on permissions for select
  to authenticated
  using (true);

-- Role permissions table: All authenticated users can view
create policy "Anyone can view role permissions"
  on role_permissions for select
  to authenticated
  using (true);

-- Space member permissions: Only admins can manage overrides
create policy "Space admins can view member permission overrides"
  on space_member_permissions for select
  to authenticated
  using (
    exists (
      select 1 from space_members sm
      join space_members target_sm on target_sm.id = space_member_permissions.space_member_id
      where sm.user_id = auth.uid()
        and sm.space_id = target_sm.space_id
        and sm.role = 'admin'
    )
  );

create policy "Space admins can insert member permission overrides"
  on space_member_permissions for insert
  to authenticated
  with check (
    exists (
      select 1 from space_members sm
      join space_members target_sm on target_sm.id = space_member_permissions.space_member_id
      where sm.user_id = auth.uid()
        and sm.space_id = target_sm.space_id
        and sm.role = 'admin'
    )
  );

create policy "Space admins can update member permission overrides"
  on space_member_permissions for update
  to authenticated
  using (
    exists (
      select 1 from space_members sm
      join space_members target_sm on target_sm.id = space_member_permissions.space_member_id
      where sm.user_id = auth.uid()
        and sm.space_id = target_sm.space_id
        and sm.role = 'admin'
    )
  );

create policy "Space admins can delete member permission overrides"
  on space_member_permissions for delete
  to authenticated
  using (
    exists (
      select 1 from space_members sm
      join space_members target_sm on target_sm.id = space_member_permissions.space_member_id
      where sm.user_id = auth.uid()
        and sm.space_id = target_sm.space_id
        and sm.role = 'admin'
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================
comment on table permissions is 'Stores all available permissions in the system';
comment on table role_permissions is 'Maps permissions to roles (admin, member, observer)';
comment on table space_member_permissions is 'Allows space-specific permission overrides for individual members';
comment on function user_has_permission is 'Check if a user has a specific permission in a space';
comment on function get_user_permissions is 'Get all permissions for a user in a space with overrides applied';
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
-- =====================================================
-- GITHUB REPOSITORY PERMISSIONS TABLE
-- =====================================================
-- This table stores which users have access to which repositories
-- Permissions are synced from GitHub periodically

create table github_repo_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  space_id uuid references spaces(id) on delete cascade not null,
  repo_owner text not null,
  repo_name text not null,
  permission_level text check (permission_level in ('none', 'read', 'triage', 'write', 'maintain', 'admin')) not null default 'none',
  last_synced_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),

  -- Ensure one permission record per user per repo per space
  unique(user_id, space_id, repo_owner, repo_name)
);

-- Index for fast lookups by user
create index idx_github_repo_permissions_user_id on github_repo_permissions(user_id);

-- Index for fast lookups by space
create index idx_github_repo_permissions_space_id on github_repo_permissions(space_id);

-- Index for fast lookups by repo
create index idx_github_repo_permissions_repo on github_repo_permissions(repo_owner, repo_name);

-- Composite index for checking if user has access to a specific repo in a space
create index idx_github_repo_permissions_lookup on github_repo_permissions(user_id, space_id, repo_owner, repo_name);

-- =====================================================
-- HELPER FUNCTION: Check if user has access to repo
-- =====================================================
create or replace function user_has_repo_access(
  p_user_id uuid,
  p_space_id uuid,
  p_repo_owner text,
  p_repo_name text,
  p_min_permission text default 'read'
)
returns boolean as $$
declare
  v_permission text;
  v_permission_rank int;
  v_min_rank int;
begin
  -- Get user's permission level for the repo
  select permission_level into v_permission
  from github_repo_permissions
  where user_id = p_user_id
    and space_id = p_space_id
    and repo_owner = p_repo_owner
    and repo_name = p_repo_name;

  -- If no permission record exists, user has no access
  if v_permission is null then
    return false;
  end if;

  -- Map permission levels to ranks for comparison
  v_permission_rank := case v_permission
    when 'none' then 0
    when 'read' then 1
    when 'triage' then 2
    when 'write' then 3
    when 'maintain' then 4
    when 'admin' then 5
    else 0
  end;

  v_min_rank := case p_min_permission
    when 'none' then 0
    when 'read' then 1
    when 'triage' then 2
    when 'write' then 3
    when 'maintain' then 4
    when 'admin' then 5
    else 1
  end;

  -- Return true if user's permission meets or exceeds minimum
  return v_permission_rank >= v_min_rank;
end;
$$ language plpgsql security definer;

-- =====================================================
-- HELPER FUNCTION: Get user's accessible repos in a space
-- =====================================================
create or replace function get_user_accessible_repos(
  p_user_id uuid,
  p_space_id uuid,
  p_min_permission text default 'read'
)
returns table (
  repo_owner text,
  repo_name text,
  permission_level text
) as $$
declare
  v_min_rank int;
begin
  -- Map minimum permission to rank
  v_min_rank := case p_min_permission
    when 'none' then 0
    when 'read' then 1
    when 'triage' then 2
    when 'write' then 3
    when 'maintain' then 4
    when 'admin' then 5
    else 1
  end;

  -- Return repos where user has at least the minimum permission
  return query
  select
    grp.repo_owner,
    grp.repo_name,
    grp.permission_level
  from github_repo_permissions grp
  where grp.user_id = p_user_id
    and grp.space_id = p_space_id
    and case grp.permission_level
      when 'none' then 0
      when 'read' then 1
      when 'triage' then 2
      when 'write' then 3
      when 'maintain' then 4
      when 'admin' then 5
      else 0
    end >= v_min_rank
  order by grp.repo_owner, grp.repo_name;
end;
$$ language plpgsql security definer;

-- =====================================================
-- COMMENTS
-- =====================================================
comment on table github_repo_permissions is 'Stores which users have access to which GitHub repositories within a space';
comment on column github_repo_permissions.permission_level is 'GitHub permission level: none, read, triage, write, maintain, or admin';
comment on column github_repo_permissions.last_synced_at is 'Last time this permission was synced from GitHub';
comment on function user_has_repo_access is 'Check if a user has at least a minimum permission level for a repository';
comment on function get_user_accessible_repos is 'Get all repositories a user can access in a space with at least a minimum permission level';
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
-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- This file implements RLS policies for all tables based on space membership and permissions

-- =====================================================
-- PROFILES TABLE
-- =====================================================
alter table profiles enable row level security;

-- Users can view all profiles
create policy "Anyone can view profiles"
  on profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- =====================================================
-- SPACES TABLE
-- =====================================================
alter table spaces enable row level security;

-- Space members can view their spaces
create policy "Space members can view spaces"
  on spaces for select
  to authenticated
  using (
    exists (
      select 1 from space_members
      where space_members.space_id = spaces.id
        and space_members.user_id = auth.uid()
    )
  );

-- Space admins can update spaces (requires space:update permission)
create policy "Space admins can update spaces"
  on spaces for update
  to authenticated
  using (
    user_has_permission(auth.uid(), id, 'space:update')
  );

-- Space admins can delete spaces (requires space:delete permission)
create policy "Space admins can delete spaces"
  on spaces for delete
  to authenticated
  using (
    user_has_permission(auth.uid(), id, 'space:delete')
  );

-- Authenticated users can create spaces (they become the first admin)
create policy "Authenticated users can create spaces"
  on spaces for insert
  to authenticated
  with check (true);

-- =====================================================
-- SPACE_MEMBERS TABLE
-- =====================================================
alter table space_members enable row level security;

-- Space members can view other members in their space
create policy "Space members can view members"
  on space_members for select
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'members:view')
  );

-- Space admins can invite members (requires members:invite permission)
create policy "Space admins can invite members"
  on space_members for insert
  to authenticated
  with check (
    user_has_permission(auth.uid(), space_id, 'members:invite')
  );

-- Space admins can update member roles (requires members:update_roles permission)
-- Members can update their own profile (nickname, status, location)
create policy "Members can update their info"
  on space_members for update
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'members:update_roles')
    or (
      user_id = auth.uid()
      and user_has_permission(auth.uid(), space_id, 'members:update_own_profile')
    )
  );

-- Space admins can remove members (requires members:remove permission)
create policy "Space admins can remove members"
  on space_members for delete
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'members:remove')
  );

-- =====================================================
-- TRACKS TABLE
-- =====================================================
alter table tracks enable row level security;

-- Space members can view tracks in their space (requires issues:view permission)
create policy "Space members can view tracks"
  on tracks for select
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'issues:view')
  );

-- Members and admins can create tracks (requires issues:create permission)
create policy "Members can create tracks"
  on tracks for insert
  to authenticated
  with check (
    user_has_permission(auth.uid(), space_id, 'issues:create')
  );

-- Admins can update all tracks, members can update their own
create policy "Users can update tracks"
  on tracks for update
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'issues:update_all')
    or (
      created_by = auth.uid()
      and user_has_permission(auth.uid(), space_id, 'issues:update_own')
    )
  );

-- Admins can delete all tracks, members can delete their own
create policy "Users can delete tracks"
  on tracks for delete
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'issues:delete_all')
    or (
      created_by = auth.uid()
      and user_has_permission(auth.uid(), space_id, 'issues:delete_own')
    )
  );

-- =====================================================
-- SESSIONS TABLE
-- =====================================================
alter table sessions enable row level security;

-- Space members can view sessions for tracks in their space
create policy "Space members can view sessions"
  on sessions for select
  to authenticated
  using (
    exists (
      select 1 from tracks
      where tracks.id = sessions.track_id
        and user_has_permission(auth.uid(), tracks.space_id, 'issues:view')
    )
  );

-- Members can create sessions on tracks they can view
create policy "Members can create sessions"
  on sessions for insert
  to authenticated
  with check (
    exists (
      select 1 from tracks
      join space_members sm on sm.space_id = tracks.space_id
      where tracks.id = sessions.track_id
        and sm.user_id = auth.uid()
        and sm.id = sessions.space_member_id
        and user_has_permission(auth.uid(), tracks.space_id, 'issues:create')
    )
  );

-- Users can update their own sessions, admins can update all
create policy "Users can update sessions"
  on sessions for update
  to authenticated
  using (
    exists (
      select 1 from tracks
      join space_members sm on sm.space_id = tracks.space_id
      where tracks.id = sessions.track_id
        and (
          user_has_permission(auth.uid(), tracks.space_id, 'issues:update_all')
          or (
            sm.user_id = auth.uid()
            and sm.id = sessions.space_member_id
            and user_has_permission(auth.uid(), tracks.space_id, 'issues:update_own')
          )
        )
    )
  );

-- Users can delete their own sessions, admins can delete all
create policy "Users can delete sessions"
  on sessions for delete
  to authenticated
  using (
    exists (
      select 1 from tracks
      join space_members sm on sm.space_id = tracks.space_id
      where tracks.id = sessions.track_id
        and (
          user_has_permission(auth.uid(), tracks.space_id, 'issues:delete_all')
          or (
            sm.user_id = auth.uid()
            and sm.id = sessions.space_member_id
            and user_has_permission(auth.uid(), tracks.space_id, 'issues:delete_own')
          )
        )
    )
  );

-- =====================================================
-- TAGS TABLE
-- =====================================================
alter table tags enable row level security;

-- Space members can view tags in their space
create policy "Space members can view tags"
  on tags for select
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'issues:view')
  );

-- Members and admins can create tags
create policy "Members can create tags"
  on tags for insert
  to authenticated
  with check (
    user_has_permission(auth.uid(), space_id, 'issues:create')
  );

-- Admins can update tags
create policy "Admins can update tags"
  on tags for update
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'issues:update_all')
  );

-- Admins can delete tags
create policy "Admins can delete tags"
  on tags for delete
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'issues:delete_all')
  );

-- =====================================================
-- SESSION_TAGS TABLE
-- =====================================================
alter table session_tags enable row level security;

-- Space members can view session tags
create policy "Space members can view session tags"
  on session_tags for select
  to authenticated
  using (
    exists (
      select 1 from sessions s
      join tracks t on t.id = s.track_id
      where s.id = session_tags.session_id
        and user_has_permission(auth.uid(), t.space_id, 'issues:view')
    )
  );

-- Users can add tags to their own sessions, admins can add tags to any session
create policy "Users can add session tags"
  on session_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from sessions s
      join tracks t on t.id = s.track_id
      join space_members sm on sm.space_id = t.space_id
      where s.id = session_tags.session_id
        and (
          user_has_permission(auth.uid(), t.space_id, 'issues:update_all')
          or (
            sm.user_id = auth.uid()
            and sm.id = s.space_member_id
            and user_has_permission(auth.uid(), t.space_id, 'issues:update_own')
          )
        )
    )
  );

-- Users can remove tags from their own sessions, admins can remove from any
create policy "Users can remove session tags"
  on session_tags for delete
  to authenticated
  using (
    exists (
      select 1 from sessions s
      join tracks t on t.id = s.track_id
      join space_members sm on sm.space_id = t.space_id
      where s.id = session_tags.session_id
        and (
          user_has_permission(auth.uid(), t.space_id, 'issues:update_all')
          or (
            sm.user_id = auth.uid()
            and sm.id = s.space_member_id
            and user_has_permission(auth.uid(), t.space_id, 'issues:update_own')
          )
        )
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
-- These indexes improve RLS policy performance

-- Index for space_members lookups by user and space
create index if not exists idx_space_members_user_space on space_members(user_id, space_id);

-- Index for tracks by space_id
create index if not exists idx_tracks_space_id on tracks(space_id);
create index if not exists idx_tracks_created_by on tracks(created_by);

-- Index for sessions by track_id and space_member_id
create index if not exists idx_sessions_track_id on sessions(track_id);
create index if not exists idx_sessions_space_member_id on sessions(space_member_id);

-- Index for tags by space_id
create index if not exists idx_tags_space_id on tags(space_id);

-- =====================================================
-- FUNCTION: Create space with first admin
-- =====================================================
-- Helper function to create a space and automatically add the creator as admin
create or replace function create_space_with_admin(
  p_name text,
  p_slug text,
  p_avatar_url text default null,
  p_github_org_id bigint default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_space_id uuid;
begin
  -- Create the space
  insert into spaces (name, slug, avatar_url, github_org_id)
  values (p_name, p_slug, p_avatar_url, p_github_org_id)
  returning id into v_space_id;

  -- Add the creator as admin
  insert into space_members (space_id, user_id, role)
  values (v_space_id, auth.uid(), 'admin');

  return v_space_id;
end;
$$;

comment on function create_space_with_admin is 'Create a new space and automatically add the creator as admin';

-- =====================================================
-- TIME OFF REQUESTS TABLE
-- =====================================================
alter table time_off_requests enable row level security;

-- Space members can view time off requests in their space (requires time_off:view permission)
create policy "Space members can view time off requests"
  on time_off_requests for select
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'time_off:view')
  );

-- Members can create their own time off requests (requires time_off:create permission)
create policy "Members can create time off requests"
  on time_off_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and user_has_permission(auth.uid(), space_id, 'time_off:create')
  );

-- Users can update their own pending requests, admins can update all
create policy "Users can update time off requests"
  on time_off_requests for update
  to authenticated
  using (
    -- Admins can update all requests (for approval/rejection)
    user_has_permission(auth.uid(), space_id, 'time_off:approve')
    or (
      -- Users can only update their own pending requests
      user_id = auth.uid()
      and status = 'pending'
      and user_has_permission(auth.uid(), space_id, 'time_off:update_own')
    )
  );

-- Users can delete their own pending requests, admins can delete all
create policy "Users can delete time off requests"
  on time_off_requests for delete
  to authenticated
  using (
    user_has_permission(auth.uid(), space_id, 'time_off:delete_all')
    or (
      user_id = auth.uid()
      and status = 'pending'
      and user_has_permission(auth.uid(), space_id, 'time_off:delete_own')
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================
comment on policy "Space members can view spaces" on spaces is 'All space members can view their space details';
comment on policy "Space admins can update spaces" on spaces is 'Only admins with space:update permission can update space settings';
comment on policy "Space admins can delete spaces" on spaces is 'Only admins with space:delete permission can delete spaces';
comment on policy "Space members can view time off requests" on time_off_requests is 'All space members can view time off requests with time_off:view permission';
comment on policy "Members can create time off requests" on time_off_requests is 'Members can create their own time off requests';
comment on policy "Users can update time off requests" on time_off_requests is 'Users can update their own pending requests; admins can approve/reject all requests';
comment on policy "Users can delete time off requests" on time_off_requests is 'Users can delete their own pending requests; admins can delete any request';
