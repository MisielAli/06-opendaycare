-- post_photos: photos attached to a post
create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null check (btrim(url) <> ''),
  width int check (width is null or width > 0),
  height int check (height is null or height > 0),
  position int not null check (position >= 0),
  created_at timestamptz not null default now()
);

create index post_photos_post_id_idx on public.post_photos (post_id);
create index post_photos_post_position_idx on public.post_photos (post_id, position);

alter table public.post_photos enable row level security;

revoke all privileges on table public.post_photos
from public, anon, authenticated, service_role;
