-- reactions: parent reactions to posts
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (btrim(type) <> ''),
  created_at timestamptz not null default now(),
  constraint reactions_post_user_unique unique (post_id, user_id)
);

create index reactions_post_id_idx on public.reactions (post_id);
create index reactions_user_id_idx on public.reactions (user_id);

alter table public.reactions enable row level security;

revoke all privileges on table public.reactions
from public, anon, authenticated, service_role;
