CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tenant_id uuid;
  _user_name text;
BEGIN
  _user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.tenants (name, status, contact_limit)
  VALUES (_user_name, 'ativo', 5000)
  RETURNING id INTO _tenant_id;

  INSERT INTO public.profiles (user_id, full_name, status, tenant_id)
  VALUES (NEW.id, _user_name, 'approved', _tenant_id);

  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'admin_gabinete', _tenant_id);

  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();