
-- 1) Fix tenant-scoped role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_tenant uuid;
BEGIN
  -- super_admin is a global role and not bound to a specific tenant
  IF _role = 'super_admin'::app_role THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role = 'super_admin'::app_role
    );
  END IF;

  _user_tenant := public.get_user_tenant_id(_user_id);

  -- For non-super_admin roles, the role grant MUST belong to the user's current tenant
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.tenant_id IS NOT DISTINCT FROM _user_tenant
  );
END;
$$;

-- 2) Remove overly-broad audit log SELECT policy that exposed audit data to any
--    authenticated tenant member; keep the admin-only "Admins can view audit logs".
DROP POLICY IF EXISTS "View audit logs" ON public.audit_logs;

-- 3) Tighten Realtime channel policy so a user can only subscribe to the
--    notifications channel for their own tenant (topic format: notifications-<tenant_id>).
DROP POLICY IF EXISTS "Allow notifications channel" ON realtime.messages;

CREATE POLICY "Allow notifications channel per tenant"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  topic LIKE 'notifications-%'
  AND auth.uid() IN (
    SELECT p.user_id
    FROM public.profiles p
    WHERE p.tenant_id = public.safe_uuid(SUBSTRING(realtime.messages.topic FROM 15))
  )
);
