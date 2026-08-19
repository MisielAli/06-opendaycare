insert into public.daycares (id, name)
values
  ('00000000-0000-4000-8000-000000000001', 'Guardería Sala Soles'),
  ('00000000-0000-4000-8000-000000000002', 'Guardería Luna Nueva'),
  ('00000000-0000-4000-8000-000000000003', 'Guardería Arcoíris'),
  ('00000000-0000-4000-8000-000000000004', 'Guardería Pequeños Exploradores')
on conflict (id) do update
set name = excluded.name;

insert into public.rooms (id, daycare_id, name)
values
  ('11111111-1111-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Soles'),
  ('11111111-1111-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'Luna'),
  ('11111111-1111-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'Estrellas')
on conflict (id) do update
set name = excluded.name;
