-- daily_summaries: one row per child per day
create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  date date not null,
  meals_count int not null default 0 check (meals_count >= 0),
  sleep_minutes int not null default 0 check (sleep_minutes >= 0),
  activities_count int not null default 0 check (activities_count >= 0),
  mood text check (mood is null or btrim(mood) <> ''),
  highlight text check (highlight is null or btrim(highlight) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_summaries_child_date_unique unique (child_id, date)
);

create index daily_summaries_child_id_idx on public.daily_summaries (child_id);
create index daily_summaries_date_idx on public.daily_summaries (date);

create function private.set_daily_summaries_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all privileges on function private.set_daily_summaries_updated_at()
from public, anon, authenticated, service_role;

create trigger set_daily_summaries_updated_at
before update on public.daily_summaries
for each row
execute function private.set_daily_summaries_updated_at();

alter table public.daily_summaries enable row level security;

revoke all privileges on table public.daily_summaries
from public, anon, authenticated, service_role;
