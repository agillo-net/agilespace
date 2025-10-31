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
