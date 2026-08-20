create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  invited_by uuid not null references public.users(id) on delete restrict,
  full_name text not null check (btrim(full_name) <> ''),
  email text not null check (btrim(email) <> '' and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  relationship public.relationship_type not null,
  code text not null unique check (code ~ '^[A-Z0-9]{5}$'),
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days') check (expires_at > created_at),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_child_id_idx on public.invitations (child_id);
create unique index invitations_code_idx on public.invitations (code);
create index invitations_email_child_status_idx on public.invitations (child_id, lower(email), status);

alter table public.invitations enable row level security;

revoke all privileges on table public.invitations
  from public, anon, authenticated, service_role;

grant select, insert, update on public.invitations to authenticated;

create policy invitations_select_staff
  on public.invitations
  for select
  to authenticated
  using (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'staff'
  );

create policy invitations_insert_staff
  on public.invitations
  for insert
  to authenticated
  with check (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'staff'
  );

create policy invitations_update_staff
  on public.invitations
  for update
  to authenticated
  using (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'staff'
  )
  with check (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'staff'
  );

revoke all privileges on type public.relationship_type
  from public, anon, authenticated, service_role;
revoke all privileges on type public.invitation_status
  from public, anon, authenticated, service_role;
