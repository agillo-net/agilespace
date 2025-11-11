-- Create session_duration_change_requests table
create table session_duration_change_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete cascade,
  original_started_at timestamp with time zone not null,
  original_ended_at timestamp with time zone,
  requested_started_at timestamp with time zone not null,
  requested_ended_at timestamp with time zone,
  reason text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index idx_session_duration_change_requests_session_id on session_duration_change_requests(session_id);
create index idx_session_duration_change_requests_requested_by on session_duration_change_requests(requested_by);
create index idx_session_duration_change_requests_status on session_duration_change_requests(status);
create index idx_session_duration_change_requests_created_at on session_duration_change_requests(created_at desc);

-- Enable Row Level Security (RLS)
alter table session_duration_change_requests enable row level security;

-- RLS Policies
-- Allow users to view requests for sessions in spaces they are members of
create policy "Users can view change requests for their space sessions" 
  on session_duration_change_requests 
  for select 
  using (
    session_id in (
      select s.id 
      from sessions s
      join tracks t on s.track_id = t.id
      join space_members sm on t.space_id = sm.space_id
      where sm.user_id = auth.uid()
    )
  );

-- Allow users to create requests for their own sessions
create policy "Users can create change requests for their own sessions" 
  on session_duration_change_requests 
  for insert 
  with check (
    requested_by = auth.uid() and
    session_id in (
      select s.id 
      from sessions s
      join space_members sm on s.space_member_id = sm.id
      where sm.user_id = auth.uid()
    )
  );

-- Allow space members to update requests (approve/reject)
create policy "Space members can update change requests" 
  on session_duration_change_requests 
  for update 
  using (
    session_id in (
      select s.id 
      from sessions s
      join tracks t on s.track_id = t.id
      join space_members sm on t.space_id = sm.space_id
      where sm.user_id = auth.uid()
    )
  );