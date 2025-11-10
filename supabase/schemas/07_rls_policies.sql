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
