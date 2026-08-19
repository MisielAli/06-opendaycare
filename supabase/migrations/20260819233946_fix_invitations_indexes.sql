-- Fix duplicate unique index on invitations.code and missing index on invited_by

-- Drop the explicit unique index that duplicates the UNIQUE constraint's index
drop index if exists public.invitations_code_idx;

-- Rename the constraint's auto index to the expected name
do $$
begin
  if exists (select 1 from pg_index where indexrelid = 'public.invitations_code_key'::regclass) then
    execute 'alter index public.invitations_code_key rename to invitations_code_idx';
  end if;
end
$$;

-- Add missing index for foreign key invited_by (performance advisor)
create index if not exists invitations_invited_by_idx on public.invitations (invited_by);
