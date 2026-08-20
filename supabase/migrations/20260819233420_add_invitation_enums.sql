do $$
begin
  if not exists (select 1 from pg_type where typname = 'relationship_type') then
    create type public.relationship_type as enum ('father', 'mother', 'guardian');
  end if;
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
  end if;
end
$$;
