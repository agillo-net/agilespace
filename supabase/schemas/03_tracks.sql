create table tracks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  issue_number integer not null,
  title text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),

  unique (organization_id, repo_owner, repo_name, issue_number)
);
