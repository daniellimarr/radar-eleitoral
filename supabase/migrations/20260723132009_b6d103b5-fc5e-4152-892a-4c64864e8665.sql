
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.handle_new_leader_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_leader = true THEN
    INSERT INTO public.leaders (contact_id, tenant_id)
    VALUES (NEW.id, NEW.tenant_id)
    ON CONFLICT (contact_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tenant_id uuid;
  _user_name text;
  _active_tenant_count integer;
BEGIN
  _user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  SELECT count(*) INTO _active_tenant_count FROM public.tenants WHERE status = 'ativo' AND deleted_at IS NULL;
  IF _active_tenant_count = 1 THEN
    SELECT id INTO _tenant_id FROM public.tenants WHERE status = 'ativo' AND deleted_at IS NULL LIMIT 1;
  ELSE
    _tenant_id := NULL;
  END IF;
  INSERT INTO public.profiles (user_id, full_name, email, status, tenant_id)
  VALUES (NEW.id, _user_name, NEW.email, 'pending', _tenant_id);
  IF _tenant_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (NEW.id, 'operador', _tenant_id);
  END IF;
  RETURN NEW;
END;
$function$;
