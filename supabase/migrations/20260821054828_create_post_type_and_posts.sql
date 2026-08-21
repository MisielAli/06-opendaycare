-- post_type enum and posts table
create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  type public.post_type not null,
  title text check (title is null or btrim(title) <> ''),
  body text not null check (btrim(body) <> ''),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index posts_room_published_idx on public.posts (room_id, published_at desc);

create function private.set_posts_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all privileges on function private.set_posts_updated_at()
from public, anon, authenticated, service_role;

create trigger set_posts_updated_at
before update on public.posts
for each row
execute function private.set_posts_updated_at();

alter table public.posts enable row level security;

revoke all privileges on table public.posts
from public, anon, authenticated, service_role;

revoke all privileges on type public.post_type
from public, anon, authenticated, service_role;
