
DROP POLICY IF EXISTS "Admin manage donations" ON public.donations;
CREATE POLICY "Admin manage donations"
ON public.donations
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR (
    (tenant_id = get_user_tenant_id(auth.uid())) 
    AND (
      has_role(auth.uid(), 'admin_gabinete'::app_role) 
      OR has_role(auth.uid(), 'coordenador'::app_role)
    )
  )
);
