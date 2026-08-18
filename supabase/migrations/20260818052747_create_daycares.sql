create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint daycares_name_not_blank check (btrim(name) <> '')
);

alter table public.daycares enable row level security;

revoke all privileges on table public.daycares
from anon, authenticated, service_role;
