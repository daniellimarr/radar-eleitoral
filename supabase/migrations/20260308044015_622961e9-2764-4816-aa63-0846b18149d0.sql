
-- Drop existing cross-tenant policies on profiles
DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin update profiles" ON public.profiles;

-- Recreate with tenant isolation for admin_gabinete and coordenador
CREATE POLICY "Admin view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role))
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Admin update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role))
    AND tenant_id = get_user_tenant_id(auth.uid())
  )
);
