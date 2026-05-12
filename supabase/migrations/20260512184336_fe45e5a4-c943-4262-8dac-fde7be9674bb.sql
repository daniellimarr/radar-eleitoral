-- Revoke public execution of sensitive functions to prevent metadata leaks
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;

-- Grant execution to authenticated users since RLS needs it
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Tighten user_permissions RLS
DROP POLICY IF EXISTS "Admin manages permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users view own permissions" ON public.user_permissions;

CREATE POLICY "Admin manages permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'super_admin'::app_role)) OR 
  (
    has_role(auth.uid(), 'admin_gabinete'::app_role) AND 
    tenant_id = get_user_tenant_id(auth.uid()) AND
    tenant_id = get_user_tenant_id(user_id)
  )
);

CREATE POLICY "Users view own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  tenant_id = get_user_tenant_id(auth.uid())
);

-- Tighten user_roles RLS to ensure tenant consistency
DROP POLICY IF EXISTS "Admin manages roles" ON public.user_roles;

CREATE POLICY "Admin manages roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (
    has_role(auth.uid(), 'admin_gabinete'::app_role) AND 
    tenant_id = get_user_tenant_id(auth.uid()) AND
    tenant_id = get_user_tenant_id(user_id) AND
    role = ANY (ARRAY['operador'::app_role, 'assessor'::app_role, 'coordenador'::app_role])
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (
    has_role(auth.uid(), 'admin_gabinete'::app_role) AND 
    tenant_id = get_user_tenant_id(auth.uid()) AND
    tenant_id = get_user_tenant_id(user_id) AND
    role = ANY (ARRAY['operador'::app_role, 'assessor'::app_role, 'coordenador'::app_role]) AND
    user_id <> auth.uid()
  )
);
