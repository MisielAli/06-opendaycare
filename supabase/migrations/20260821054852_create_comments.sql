-- comments on posts
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (btrim(body) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);

create function private.set_comments_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all privileges on function private.set_comments_updated_at()
from public, anon, authenticated, service_role;

create trigger set_comments_updated_at
before update on public.comments
for each row
execute function private.set_comments_updated_at();

alter table public.comments enable row level security;

revoke all privileges on table public.comments
from public, anon, authenticated, service_role;
