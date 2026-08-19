create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  constraint parent_children_parent_child_unique unique (parent_id, child_id)
);

create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx on public.parent_children (child_id);

alter table public.parent_children enable row level security;

revoke all privileges on table public.parent_children
  from public, anon, authenticated, service_role;

grant select on public.parent_children to authenticated;

create policy parent_children_select_authenticated
  on public.parent_children
  for select
  to authenticated
  using (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' in ('staff', 'parent', 'admin')
  );

-- Function: accept_invitation — transaccional, SECURITY DEFINER, search_path = ''
create or replace function public.accept_invitation(p_code text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations%rowtype;
  v_parent_id uuid;
begin
  select * into v_inv from public.invitations
   where code = p_code and lower(email) = lower(p_email)
   for update;

  if not found then raise exception 'invitation_not_found'; end if;
  if v_inv.status <> 'pending' then raise exception 'invitation_not_pending'; end if;
  if v_inv.expires_at <= now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'invitation_expired';
  end if;

  v_parent_id := auth.uid();
  if v_parent_id is null then raise exception 'not_authenticated'; end if;

  insert into public.parent_children(parent_id, child_id, relationship)
  values (v_parent_id, v_inv.child_id, v_inv.relationship)
  on conflict (parent_id, child_id) do nothing;

  update public.invitations
     set status = 'accepted', accepted_at = now()
   where id = v_inv.id;

  return v_inv.child_id;
end;
$$;

revoke all privileges on function public.accept_invitation(text, text)
  from public, anon, authenticated, service_role;

grant execute on function public.accept_invitation(text, text) to authenticated;
