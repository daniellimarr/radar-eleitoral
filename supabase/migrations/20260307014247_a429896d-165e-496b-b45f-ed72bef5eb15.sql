
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email = 'operador@radareleitoral.com';
