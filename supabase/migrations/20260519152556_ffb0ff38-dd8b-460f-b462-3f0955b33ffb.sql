-- Reverting policies added in the audit migration
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their tenant subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;

-- Reverting SECURITY DEFINER flags and parameter names by using the same names as current but without the DEFINER flag
-- To avoid "parameter name" errors, I'll use exactly what is currently in place but remove the SECURITY DEFINER attribute.
-- Based on the previous failed migration, the current parameter names are likely _user_id and _role.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY INVOKER
 AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 AS $$
BEGIN
  RETURN (
    SELECT tenant_id FROM profiles
    WHERE user_id = _user_id
    LIMIT 1
  );
END;
$$;
