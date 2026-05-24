-- 1) Fix get_user_tenant_id: SECURITY DEFINER + STABLE
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 2) Campaigns: tenant isolation
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campaigns;

CREATE POLICY "Tenant view campaigns"
ON public.campaigns FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant manage campaigns"
ON public.campaigns FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- 3) Contacts: tenant isolation (keep anon insert for public registration)
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;

CREATE POLICY "Tenant view contacts"
ON public.contacts FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant manage contacts"
ON public.contacts FOR ALL TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- 4) Audit logs: filter by tenant
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    public.has_role(auth.uid(), 'admin_gabinete'::app_role)
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- 5) Chat conversations: only creator can delete
DROP POLICY IF EXISTS "Creator delete conversations" ON public.chat_conversations;

CREATE POLICY "Creator delete conversations"
ON public.chat_conversations FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- 6) Notifications: add WITH CHECK to UPDATE and a DELETE policy
DROP POLICY IF EXISTS "Tenant update notifications" ON public.notifications;

CREATE POLICY "Tenant update notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));