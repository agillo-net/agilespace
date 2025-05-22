create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text,
  avatar_url text,
  full_name text,
  created_at timestamp with time zone default now()
);
