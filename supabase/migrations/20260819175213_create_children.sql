create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[],
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint children_birth_date_not_future check (birth_date <= current_date),
  constraint children_full_name_not_blank check (btrim(full_name) <> '')
);

create index children_room_id_idx on public.children (room_id);

create function private.set_children_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all privileges on function private.set_children_updated_at()
from public, anon, authenticated, service_role;

create trigger set_children_updated_at
before update on public.children
for each row
execute function private.set_children_updated_at();

alter table public.children enable row level security;

revoke all privileges on table public.children
from public, anon, authenticated, service_role;

grant select, insert, update on public.children to authenticated;

create policy children_select_authenticated
on public.children
for select
to authenticated
using (
  (select auth.jwt()) -> 'app_metadata' ->> 'role' in ('staff', 'parent', 'admin')
);

create policy children_insert_staff
on public.children
for insert
to authenticated
with check (
  (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'staff'
);

create policy children_update_staff
on public.children
for update
to authenticated
using (
  (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'staff'
)
with check (
  (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'staff'
);
