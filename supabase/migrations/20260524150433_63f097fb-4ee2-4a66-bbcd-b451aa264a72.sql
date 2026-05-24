-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id uuid;
  _user_name text;
  _active_tenant_count integer;
BEGIN
  _user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- Check how many active tenants exist
  SELECT count(*) INTO _active_tenant_count FROM public.tenants WHERE status = 'ativo' AND deleted_at IS NULL;

  -- If there is exactly one active tenant, use it. Otherwise, don't create one.
  IF _active_tenant_count = 1 THEN
    SELECT id INTO _tenant_id FROM public.tenants WHERE status = 'ativo' AND deleted_at IS NULL LIMIT 1;
  ELSE
    _tenant_id := NULL;
  END IF;

  -- Create profile. If _tenant_id is NULL, the user will need to be approved and assigned to a tenant.
  INSERT INTO public.profiles (user_id, full_name, email, status, tenant_id)
  VALUES (NEW.id, _user_name, NEW.email, 'pending', _tenant_id);

  -- Only assign role if we have a tenant
  IF _tenant_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (NEW.id, 'operador', _tenant_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
