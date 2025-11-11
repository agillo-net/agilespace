alter table if exists public.space_members
add status text check (status in ('online', 'offline')) default 'offline',
add location text check (location in ('office', 'remote')) default null,
add last_status_update_at timestamp with time zone default now();
