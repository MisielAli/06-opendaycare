create type public.user_role as enum ('staff', 'parent', 'admin');

create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_full_name_not_blank check (btrim(full_name) <> '')
);

create index users_daycare_id_idx on public.users (daycare_id);

create schema private;

revoke all privileges on schema private
from public, anon, authenticated, service_role;

create function private.set_users_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all privileges on function private.set_users_updated_at()
from public, anon, authenticated, service_role;

create trigger set_users_updated_at
before update on public.users
for each row
execute function private.set_users_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_app_metadata jsonb;
  daycare_id_text text;
  role_text text;
  full_name_text text;
  resolved_daycare_id uuid;
  resolved_role public.user_role;
begin
  select raw_app_meta_data
  into user_app_metadata
  from auth.users
  where id = new.id;

  if not found then
    raise exception 'Auth user no longer exists when creating its profile';
  end if;

  daycare_id_text = user_app_metadata ->> 'daycare_id';
  role_text = user_app_metadata ->> 'role';
  full_name_text = user_app_metadata ->> 'full_name';

  if daycare_id_text is null or btrim(daycare_id_text) = '' then
    raise exception 'Auth app_metadata.daycare_id is required';
  end if;

  begin
    resolved_daycare_id = daycare_id_text::uuid;
  exception
    when invalid_text_representation then
      raise exception 'Auth app_metadata.daycare_id must be a valid UUID';
  end;

  if not exists (
    select 1
    from public.daycares
    where id = resolved_daycare_id
  ) then
    raise exception 'Auth app_metadata.daycare_id does not reference an existing daycare';
  end if;

  if role_text is null or btrim(role_text) = '' then
    raise exception 'Auth app_metadata.role is required';
  end if;

  begin
    resolved_role = role_text::public.user_role;
  exception
    when invalid_text_representation then
      raise exception 'Auth app_metadata.role is invalid';
  end;

  if full_name_text is null or btrim(full_name_text) = '' then
    raise exception 'Auth app_metadata.full_name is required and cannot be blank';
  end if;

  insert into public.users (id, daycare_id, role, full_name)
  values (new.id, resolved_daycare_id, resolved_role, full_name_text);

  return new;
end;
$$;

revoke all privileges on function private.handle_new_auth_user()
from public, anon, authenticated, service_role;

create constraint trigger on_auth_user_created
after insert on auth.users
deferrable initially deferred
for each row
execute function private.handle_new_auth_user();

alter table public.users enable row level security;

revoke all privileges on table public.users
from public, anon, authenticated, service_role;

revoke all privileges on type public.user_role
from public, anon, authenticated, service_role;

revoke all privileges on type public.user_status
from public, anon, authenticated, service_role;
