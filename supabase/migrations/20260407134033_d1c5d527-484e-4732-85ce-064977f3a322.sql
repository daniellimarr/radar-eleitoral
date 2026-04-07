
-- Drop existing policy and recreate with proper self-assignment prevention
DROP POLICY IF EXISTS "Admin manages roles" ON public.user_roles;

CREATE POLICY "Admin manages roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin_gabinete')
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin_gabinete')
  AND role != 'super_admin'
  AND user_id != auth.uid()
);
