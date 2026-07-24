
-- Scope tenant-only policies to authenticated role
DROP POLICY IF EXISTS "Admin manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin view expenses" ON public.expenses;
CREATE POLICY "Admin manage expenses" ON public.expenses FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')));

DROP POLICY IF EXISTS "Admin manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admin view suppliers" ON public.suppliers;
CREATE POLICY "Admin manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')));

DROP POLICY IF EXISTS "Admin manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admin view vehicles" ON public.vehicles;
CREATE POLICY "Admin manage vehicles" ON public.vehicles FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')));

DROP POLICY IF EXISTS "Admin manage whatsapp_automations" ON public.whatsapp_automations;
DROP POLICY IF EXISTS "Admin view whatsapp_automations" ON public.whatsapp_automations;
CREATE POLICY "Admin manage whatsapp_automations" ON public.whatsapp_automations FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')));

DROP POLICY IF EXISTS "Admin manage whatsapp_send_logs" ON public.whatsapp_send_logs;
DROP POLICY IF EXISTS "Admin view whatsapp_send_logs" ON public.whatsapp_send_logs;
CREATE POLICY "Admin manage whatsapp_send_logs" ON public.whatsapp_send_logs FOR ALL TO authenticated
  USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin_gabinete') OR has_role(auth.uid(),'coordenador')));

-- Lock down pending_signups: only super_admin can read; writes only via service_role edge functions
REVOKE ALL ON public.pending_signups FROM anon, authenticated;
GRANT SELECT ON public.pending_signups TO authenticated;
GRANT ALL ON public.pending_signups TO service_role;
CREATE POLICY "Super admin can view pending signups" ON public.pending_signups
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin'));

-- Explicit restrictive protection against audit log tampering (defense in depth)
CREATE POLICY "No one can update audit logs" ON public.audit_logs AS RESTRICTIVE
  FOR UPDATE TO public USING (false) WITH CHECK (false);
CREATE POLICY "No one can delete audit logs" ON public.audit_logs AS RESTRICTIVE
  FOR DELETE TO public USING (false);
