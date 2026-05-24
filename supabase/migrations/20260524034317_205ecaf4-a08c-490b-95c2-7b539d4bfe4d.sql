-- Leaders RLS
DROP POLICY IF EXISTS "Tenant manage leaders" ON public.leaders;
CREATE POLICY "Tenant manage leaders" ON public.leaders
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

-- Registration Links RLS
DROP POLICY IF EXISTS "Tenant insert links" ON public.registration_links;
CREATE POLICY "Tenant insert links" ON public.registration_links
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Tenant update links" ON public.registration_links;
CREATE POLICY "Tenant update links" ON public.registration_links
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Tenant delete links" ON public.registration_links;
CREATE POLICY "Tenant delete links" ON public.registration_links
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
