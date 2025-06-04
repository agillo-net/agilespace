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
