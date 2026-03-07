
-- Create the auth user for the test operator
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'operador@radareleitoral.com',
  crypt('Operador@2025', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Operador Teste"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now()
);

-- Get the user id we just created and set up profile, role, permissions
DO $$
DECLARE
  _user_id uuid;
  _tenant_id uuid := '2b2d1200-c7fc-4d7f-aa63-edd351a11c67';
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'operador@radareleitoral.com';

  -- Update profile with tenant and approved status
  UPDATE public.profiles
  SET tenant_id = _tenant_id, full_name = 'Operador Teste', status = 'approved'
  WHERE user_id = _user_id;

  -- If profile wasn't created by trigger, insert it
  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, tenant_id, full_name, status)
    VALUES (_user_id, _tenant_id, 'Operador Teste', 'approved');
  END IF;

  -- Assign operador role
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (_user_id, 'operador', _tenant_id);

  -- Add module permissions
  INSERT INTO public.user_permissions (user_id, module, tenant_id)
  VALUES
    (_user_id, 'contacts', _tenant_id),
    (_user_id, 'demands', _tenant_id),
    (_user_id, 'appointments', _tenant_id);
END $$;
