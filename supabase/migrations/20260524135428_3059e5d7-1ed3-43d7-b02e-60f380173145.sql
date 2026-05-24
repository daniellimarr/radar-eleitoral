
-- 1. Restrict anon contact insert to safe defaults
DROP POLICY IF EXISTS "Public registration via link" ON public.contacts;
CREATE POLICY "Public registration via link"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registration_links rl
    WHERE rl.tenant_id = contacts.tenant_id
      AND rl.is_active = true
      AND (rl.expires_at IS NULL OR rl.expires_at > now())
  )
  AND is_leader = false
  AND (engagement IS NULL OR engagement = 'nao_trabalhado'::engagement_level)
  AND registered_by IS NULL
  AND category IS NULL
  AND subcategory IS NULL
  AND (tags IS NULL OR tags = '{}'::text[])
  AND deleted_at IS NULL
);

-- 2. Remove broad anon SELECT on tenants
DROP POLICY IF EXISTS "Anon view tenant via registration link" ON public.tenants;

-- 3. Restrict voter_interactions & content_plans to authenticated only
DROP POLICY IF EXISTS "Tenant manage voter_interactions" ON public.voter_interactions;
DROP POLICY IF EXISTS "Tenant view voter_interactions" ON public.voter_interactions;
CREATE POLICY "Tenant manage voter_interactions"
ON public.voter_interactions
FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant view voter_interactions"
ON public.voter_interactions
FOR SELECT
TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Tenant manage content_plans" ON public.content_plans;
DROP POLICY IF EXISTS "Tenant view content_plans" ON public.content_plans;
CREATE POLICY "Tenant manage content_plans"
ON public.content_plans
FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant view content_plans"
ON public.content_plans
FOR SELECT
TO authenticated
USING ((tenant_id = get_user_tenant_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));
