
-- Update has_role to scope by tenant for non-super_admin roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _role = 'super_admin'::app_role
        OR tenant_id = get_user_tenant_id(_user_id)
      )
  )
$$;
