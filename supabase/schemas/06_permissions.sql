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
