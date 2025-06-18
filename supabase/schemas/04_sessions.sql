create table sessions (
  id uuid primary key default gen_random_uuid(),
  github_issue_url text not null,
  space_member_id uuid references space_members(id) on delete cascade,
  comment_url text default null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  skipped_summary boolean default false
);

create index idx_sessions_github_issue_url on sessions(github_issue_url);
create index idx_sessions_space_member_github_issue on sessions(space_member_id, github_issue_url);
