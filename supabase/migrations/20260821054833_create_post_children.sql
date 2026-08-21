-- post_children: many-to-many posts <-> children, feed filter
create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (post_id, child_id)
);

create index post_children_post_id_idx on public.post_children (post_id);
create index post_children_child_id_idx on public.post_children (child_id);

alter table public.post_children enable row level security;

revoke all privileges on table public.post_children
from public, anon, authenticated, service_role;
