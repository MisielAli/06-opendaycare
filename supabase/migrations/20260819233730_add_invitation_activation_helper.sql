-- Helper for /activate-account: returns invitation context without exposing all invitations
-- SECURITY DEFINER allows anon to validate code+email and derive daycare_id before signUp

create or replace function public.get_invitation_context(p_code text, p_email text)
returns table (
  child_id uuid,
  daycare_id uuid,
  full_name text,
  relationship public.relationship_type,
  status public.invitation_status,
  expires_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    i.child_id,
    r.daycare_id,
    i.full_name,
    i.relationship,
    i.status,
    i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = p_code
    and lower(i.email) = lower(p_email)
  limit 1;
$$;

revoke all privileges on function public.get_invitation_context(text, text)
  from public, anon, authenticated, service_role;

grant execute on function public.get_invitation_context(text, text) to anon, authenticated;
