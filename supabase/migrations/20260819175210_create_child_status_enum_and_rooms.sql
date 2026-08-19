create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  constraint rooms_name_not_blank check (btrim(name) <> '')
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);

alter table public.rooms enable row level security;

revoke all privileges on table public.rooms
from public, anon, authenticated, service_role;

revoke all privileges on type public.child_status
from public, anon, authenticated, service_role;

grant usage on type public.child_status to authenticated;

grant select on public.rooms to authenticated;

create policy rooms_select_authenticated
on public.rooms
for select
to authenticated
using (
  (select auth.jwt()) -> 'app_metadata' ->> 'role' in ('staff', 'parent', 'admin')
);
