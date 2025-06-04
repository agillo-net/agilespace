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
  joined_at timestamp with time zone default now(),
  last_active_at timestamp with time zone
);
