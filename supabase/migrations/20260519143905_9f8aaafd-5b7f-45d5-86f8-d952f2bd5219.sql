DROP POLICY IF EXISTS "Admin manage campaigns" ON public.campaigns;

CREATE POLICY "Admin manage campaigns"
ON public.campaigns
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin_gabinete'::app_role)
      OR has_role(auth.uid(), 'coordenador'::app_role)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin_gabinete'::app_role)
      OR has_role(auth.uid(), 'coordenador'::app_role)
    )
  )
);