
-- Helper: is_developer
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'developer'::app_role);
$$;

-- Unlink developer users from any tenant so tenant-scoped policies deny access
UPDATE public.profiles p
   SET tenant_id = NULL
 WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'developer'::app_role);

-- Business tables: exclude developer explicitly from every policy
-- contacts
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant manage contacts" ON public.contacts;
CREATE POLICY "Tenant users view contacts" ON public.contacts FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND NOT is_developer(auth.uid()));
CREATE POLICY "Tenant manage contacts" ON public.contacts FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND NOT is_developer(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND NOT is_developer(auth.uid()));

-- appointments
DROP POLICY IF EXISTS "Tenant view appointments" ON public.appointments;
CREATE POLICY "Tenant view appointments" ON public.appointments FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- campaign_files
DROP POLICY IF EXISTS "Tenant view campaign_files" ON public.campaign_files;
DROP POLICY IF EXISTS "Admin manage campaign_files" ON public.campaign_files;
CREATE POLICY "Tenant view campaign_files" ON public.campaign_files FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));
CREATE POLICY "Admin manage campaign_files" ON public.campaign_files FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND NOT is_developer(auth.uid()));

-- campaign_materials
DROP POLICY IF EXISTS "Tenant view materials" ON public.campaign_materials;
CREATE POLICY "Tenant view materials" ON public.campaign_materials FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- campaigns
DROP POLICY IF EXISTS "Tenant view campaigns" ON public.campaigns;
CREATE POLICY "Tenant view campaigns" ON public.campaigns FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- content_plans
DROP POLICY IF EXISTS "Tenant view content_plans" ON public.content_plans;
CREATE POLICY "Tenant view content_plans" ON public.content_plans FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- demand_documents
DROP POLICY IF EXISTS "Tenant view demand documents" ON public.demand_documents;
CREATE POLICY "Tenant view demand documents" ON public.demand_documents FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- demands
DROP POLICY IF EXISTS "Tenant view demands" ON public.demands;
CREATE POLICY "Tenant view demands" ON public.demands FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- donations
DROP POLICY IF EXISTS "Admin view donations" ON public.donations;
DROP POLICY IF EXISTS "Admin manage donations" ON public.donations;
CREATE POLICY "Admin view donations" ON public.donations FOR SELECT
  USING ((has_role(auth.uid(),'super_admin'::app_role) OR (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)))) AND NOT is_developer(auth.uid()));
CREATE POLICY "Admin manage donations" ON public.donations FOR ALL
  USING ((has_role(auth.uid(),'super_admin'::app_role) OR (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)))) AND NOT is_developer(auth.uid()))
  WITH CHECK ((has_role(auth.uid(),'super_admin'::app_role) OR (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)))) AND NOT is_developer(auth.uid()));

-- expenses
DROP POLICY IF EXISTS "Admin manage expenses" ON public.expenses;
CREATE POLICY "Admin manage expenses" ON public.expenses FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()));

-- leaders
DROP POLICY IF EXISTS "Tenant view leaders" ON public.leaders;
DROP POLICY IF EXISTS "Tenant manage leaders" ON public.leaders;
CREATE POLICY "Tenant view leaders" ON public.leaders FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));
CREATE POLICY "Tenant manage leaders" ON public.leaders FOR ALL
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- registration_links
DROP POLICY IF EXISTS "Tenant view links" ON public.registration_links;
DROP POLICY IF EXISTS "Tenant delete links" ON public.registration_links;
DROP POLICY IF EXISTS "Tenant update links" ON public.registration_links;
DROP POLICY IF EXISTS "Tenant insert links" ON public.registration_links;
CREATE POLICY "Tenant view links" ON public.registration_links FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));
CREATE POLICY "Tenant delete links" ON public.registration_links FOR DELETE
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));
CREATE POLICY "Tenant update links" ON public.registration_links FOR UPDATE
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));
CREATE POLICY "Tenant insert links" ON public.registration_links FOR INSERT
  WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- suppliers
DROP POLICY IF EXISTS "Admin manage suppliers" ON public.suppliers;
CREATE POLICY "Admin manage suppliers" ON public.suppliers FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()));

-- vehicles
DROP POLICY IF EXISTS "Admin manage vehicles" ON public.vehicles;
CREATE POLICY "Admin manage vehicles" ON public.vehicles FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()));

-- visit_requests
DROP POLICY IF EXISTS "Tenant view visit requests" ON public.visit_requests;
CREATE POLICY "Tenant view visit requests" ON public.visit_requests FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- voter_interactions
DROP POLICY IF EXISTS "Tenant view voter_interactions" ON public.voter_interactions;
CREATE POLICY "Tenant view voter_interactions" ON public.voter_interactions FOR SELECT
  USING ((tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(),'super_admin'::app_role)) AND NOT is_developer(auth.uid()));

-- whatsapp_automations
DROP POLICY IF EXISTS "Admin manage whatsapp_automations" ON public.whatsapp_automations;
CREATE POLICY "Admin manage whatsapp_automations" ON public.whatsapp_automations FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()));

-- whatsapp_send_logs
DROP POLICY IF EXISTS "Admin manage whatsapp_send_logs" ON public.whatsapp_send_logs;
CREATE POLICY "Admin manage whatsapp_send_logs" ON public.whatsapp_send_logs FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'admin_gabinete'::app_role) OR has_role(auth.uid(),'coordenador'::app_role)) AND NOT is_developer(auth.uid()));

-- audit_logs: developer sees system logs is fine; keep as-is.

-- Also lock get_tenant_leaders RPC for developers
CREATE OR REPLACE FUNCTION public.get_tenant_leaders(p_tenant_id uuid)
 RETURNS TABLE(id uuid, name text, nickname text, gender text, birth_date date, phone text, has_whatsapp boolean, cep text, address text, address_number text, neighborhood text, city text, state text, voting_zone text, voting_section text, voting_location text, engagement engagement_level, is_leader boolean, leader_id uuid, tenant_id uuid, registered_by uuid, latitude double precision, longitude double precision, created_at timestamp with time zone, updated_at timestamp with time zone, deleted_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT c.id, c.name, c.nickname, c.gender, c.birth_date,
    public.decrypt_sensitive(c.phone) AS phone,
    c.has_whatsapp, c.cep, c.address, c.address_number, c.neighborhood, c.city, c.state,
    c.voting_zone, c.voting_section, c.voting_location, c.engagement, c.is_leader, c.leader_id,
    c.tenant_id, c.registered_by, c.latitude, c.longitude, c.created_at, c.updated_at, c.deleted_at
  FROM public.contacts c
  WHERE c.tenant_id = p_tenant_id
    AND c.deleted_at IS NULL
    AND c.is_leader IS TRUE
    AND p_tenant_id = public.get_user_tenant_id(auth.uid())
    AND NOT public.is_developer(auth.uid())
  ORDER BY c.name ASC;
$function$;
