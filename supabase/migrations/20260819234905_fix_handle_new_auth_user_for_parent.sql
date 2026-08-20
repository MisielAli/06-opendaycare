create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_app_metadata jsonb;
  user_user_metadata jsonb;
  daycare_id_text text;
  role_text text;
  full_name_text text;
  resolved_daycare_id uuid;
  resolved_role public.user_role;
begin
  select raw_app_meta_data, raw_user_meta_data
  into user_app_metadata, user_user_metadata
  from auth.users
  where id = new.id;

  if not found then
    raise exception 'Auth user no longer exists when creating its profile';
  end if;

  daycare_id_text = coalesce(user_app_metadata ->> 'daycare_id', user_user_metadata ->> 'daycare_id');
  role_text = coalesce(user_app_metadata ->> 'role', user_user_metadata ->> 'role');
  full_name_text = coalesce(user_app_metadata ->> 'full_name', user_user_metadata ->> 'full_name');

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