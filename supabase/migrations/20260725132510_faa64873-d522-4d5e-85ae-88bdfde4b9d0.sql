-- 1. login_attempts: restrict to authenticated super_admins
DROP POLICY IF EXISTS "System manages login attempts" ON public.login_attempts;
CREATE POLICY "Super admins read login attempts"
ON public.login_attempts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. nps_surveys: remove broad anon read, expose safe columns via RPC
DROP POLICY IF EXISTS "Public read active nps surveys" ON public.nps_surveys;

CREATE OR REPLACE FUNCTION public.get_public_nps_survey(p_slug text)
RETURNS TABLE(id uuid, tenant_id uuid, title text, description text, slug text, start_date date, end_date date, status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.tenant_id, s.title, s.description, s.slug, s.start_date, s.end_date, s.status
  FROM public.nps_surveys s
  WHERE s.slug = p_slug
    AND s.status = 'ativa'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_nps_survey(text) TO anon, authenticated;

-- 3. Scope tenant policies to authenticated role (same conditions)
DROP POLICY IF EXISTS "Tenant view appointments" ON public.appointments;
CREATE POLICY "Tenant view appointments" ON public.appointments FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin manage campaign_files" ON public.campaign_files;
CREATE POLICY "Admin manage campaign_files" ON public.campaign_files FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view campaign_files" ON public.campaign_files;
CREATE POLICY "Tenant view campaign_files" ON public.campaign_files FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view materials" ON public.campaign_materials;
CREATE POLICY "Tenant view materials" ON public.campaign_materials FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view campaigns" ON public.campaigns;
CREATE POLICY "Tenant view campaigns" ON public.campaigns FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant manage contacts" ON public.contacts;
CREATE POLICY "Tenant manage contacts" ON public.contacts FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (NOT is_developer(auth.uid())))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;
CREATE POLICY "Tenant users view contacts" ON public.contacts FOR SELECT TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view content_plans" ON public.content_plans;
CREATE POLICY "Tenant view content_plans" ON public.content_plans FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view demand documents" ON public.demand_documents;
CREATE POLICY "Tenant view demand documents" ON public.demand_documents FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view demands" ON public.demands;
CREATE POLICY "Tenant view demands" ON public.demands FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin manage donations" ON public.donations;
CREATE POLICY "Admin manage donations" ON public.donations FOR ALL TO authenticated
USING ((has_role(auth.uid(), 'super_admin'::app_role) OR ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)))) AND (NOT is_developer(auth.uid())))
WITH CHECK ((has_role(auth.uid(), 'super_admin'::app_role) OR ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)))) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin view donations" ON public.donations;
CREATE POLICY "Admin view donations" ON public.donations FOR SELECT TO authenticated
USING ((has_role(auth.uid(), 'super_admin'::app_role) OR ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)))) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin manage expenses" ON public.expenses;
CREATE POLICY "Admin manage expenses" ON public.expenses FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant manage leaders" ON public.leaders;
CREATE POLICY "Tenant manage leaders" ON public.leaders FOR ALL TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())))
WITH CHECK (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view leaders" ON public.leaders;
CREATE POLICY "Tenant view leaders" ON public.leaders FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant delete links" ON public.registration_links;
CREATE POLICY "Tenant delete links" ON public.registration_links FOR DELETE TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant insert links" ON public.registration_links;
CREATE POLICY "Tenant insert links" ON public.registration_links FOR INSERT TO authenticated
WITH CHECK (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant update links" ON public.registration_links;
CREATE POLICY "Tenant update links" ON public.registration_links FOR UPDATE TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view links" ON public.registration_links;
CREATE POLICY "Tenant view links" ON public.registration_links FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin manage suppliers" ON public.suppliers;
CREATE POLICY "Admin manage suppliers" ON public.suppliers FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin manage vehicles" ON public.vehicles;
CREATE POLICY "Admin manage vehicles" ON public.vehicles FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view visit requests" ON public.visit_requests;
CREATE POLICY "Tenant view visit requests" ON public.visit_requests FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Tenant view voter_interactions" ON public.voter_interactions;
CREATE POLICY "Tenant view voter_interactions" ON public.voter_interactions FOR SELECT TO authenticated
USING (((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin manage whatsapp_automations" ON public.whatsapp_automations;
CREATE POLICY "Admin manage whatsapp_automations" ON public.whatsapp_automations FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())));

DROP POLICY IF EXISTS "Admin manage whatsapp_send_logs" ON public.whatsapp_send_logs;
CREATE POLICY "Admin manage whatsapp_send_logs" ON public.whatsapp_send_logs FOR ALL TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())))
WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) AND (NOT is_developer(auth.uid())));