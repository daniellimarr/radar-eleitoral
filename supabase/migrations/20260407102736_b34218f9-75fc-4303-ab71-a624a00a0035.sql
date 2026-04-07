
-- 1. Fix user_roles RLS: prevent admin_gabinete from assigning super_admin
DROP POLICY IF EXISTS "Admin manages roles" ON public.user_roles;
CREATE POLICY "Admin manages roles" ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_gabinete'::app_role))
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      has_role(auth.uid(), 'admin_gabinete'::app_role)
      AND role != 'super_admin'::app_role
      AND tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- 2. Fix chat_participants INSERT policy: enforce tenant isolation
DROP POLICY IF EXISTS "Tenant users insert participants" ON public.chat_participants;
CREATE POLICY "Tenant users insert participants" ON public.chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations cc
      WHERE cc.id = chat_participants.conversation_id
        AND cc.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- 3. Fix anon contacts policy: restrict to only name field via RPC instead
-- We can't restrict columns via RLS, so create a function for anon leader lookup
CREATE OR REPLACE FUNCTION public.get_leader_name_for_link(p_slug text)
RETURNS TABLE(leader_name text) 
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name as leader_name
  FROM registration_links rl
  JOIN contacts c ON c.id = rl.leader_contact_id
  WHERE rl.slug = p_slug
    AND rl.is_active = true
    AND (rl.expires_at IS NULL OR rl.expires_at > now())
  LIMIT 1;
$$;

-- Remove the overly broad anon contact SELECT policy
DROP POLICY IF EXISTS "Anon view leader via registration link" ON public.contacts;

-- 4. Fix anon registration_links policy: require slug filter
DROP POLICY IF EXISTS "Anon view active links" ON public.registration_links;
CREATE POLICY "Anon view active links" ON public.registration_links
  FOR SELECT TO anon
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );
