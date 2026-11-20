-- LOCAL DEVELOPMENT ONLY (supabase db reset). Never run against production.
-- Two dev users until Identity (M6): dev@makecalgarytalk.local and dev2@makecalgarytalk.local,
-- password "dev-password" (not a secret: they exist only in the local Docker database).
-- Both are members of Mahogany, so two browsers can play the same community (?devuser=2).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-00000000de01', 'authenticated', 'authenticated',
  'dev@makecalgarytalk.local', extensions.crypt('dev-password', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'd0000000-0000-4000-8000-00000000de01', 'd0000000-0000-4000-8000-00000000de01',
  '{"sub": "d0000000-0000-4000-8000-00000000de01", "email": "dev@makecalgarytalk.local"}', 'email', now(), now(), now()
) on conflict do nothing;

-- Joins through the game rule so the membership event is recorded too.
select residency.add_verified_resident_at('d0000000-0000-4000-8000-00000000de01', c.id, now())
from gamecore.communities c where c.city = 'calgary' and c.code = 'MAH';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-00000000de02', 'authenticated', 'authenticated',
  'dev2@makecalgarytalk.local', extensions.crypt('dev-password', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'd0000000-0000-4000-8000-00000000de02', 'd0000000-0000-4000-8000-00000000de02',
  '{"sub": "d0000000-0000-4000-8000-00000000de02", "email": "dev2@makecalgarytalk.local"}', 'email', now(), now(), now()
) on conflict do nothing;

-- Joins through the game rule so the membership event is recorded too.
select residency.add_verified_resident_at('d0000000-0000-4000-8000-00000000de02', c.id, now())
from gamecore.communities c where c.city = 'calgary' and c.code = 'MAH';

-- Dev users skip the first visit (profile already set); the anonymous flow shows it.
insert into identity.profiles (user_id, nickname, shirt) values
  ('d0000000-0000-4000-8000-00000000de01', 'Dev One', 0),
  ('d0000000-0000-4000-8000-00000000de02', 'Dev Two', 4)
on conflict (user_id) do nothing;
