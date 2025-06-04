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
