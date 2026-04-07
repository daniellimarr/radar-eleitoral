
-- Drop and recreate the policy with a restricted USING clause
DROP POLICY IF EXISTS "Admin manages roles" ON public.user_roles;

CREATE POLICY "Admin manages roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  -- super_admin: full access within any tenant
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    -- admin_gabinete: can only see/modify operador, assessor, coordenador rows in own tenant
    has_role(auth.uid(), 'admin_gabinete'::app_role)
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND role IN ('operador'::app_role, 'assessor'::app_role, 'coordenador'::app_role)
  )
)
WITH CHECK (
  -- super_admin: can assign any role
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    -- admin_gabinete: can only assign operador, assessor, coordenador, not to self
    has_role(auth.uid(), 'admin_gabinete'::app_role)
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND role IN ('operador'::app_role, 'assessor'::app_role, 'coordenador'::app_role)
    AND user_id != auth.uid()
  )
);
