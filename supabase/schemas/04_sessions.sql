create table sessions (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id) on delete cascade,
  organization_member_id uuid references organization_members(id) on delete cascade,
  comment_id integer default null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  skipped_summary boolean default false
);
