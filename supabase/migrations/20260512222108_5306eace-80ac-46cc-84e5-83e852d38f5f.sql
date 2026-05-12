
-- 1) Secure SECURITY DEFINER function to fetch registration link info by slug
CREATE OR REPLACE FUNCTION public.get_registration_link_info(p_slug text)
RETURNS TABLE(tenant_id uuid, tenant_name text, leader_contact_id uuid, leader_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rl.tenant_id,
         t.name AS tenant_name,
         rl.leader_contact_id,
         c.name AS leader_name
  FROM public.registration_links rl
  LEFT JOIN public.tenants t ON t.id = rl.tenant_id
  LEFT JOIN public.contacts c ON c.id = rl.leader_contact_id
  WHERE rl.slug = p_slug
    AND rl.is_active = true
    AND (rl.expires_at IS NULL OR rl.expires_at > now())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_registration_link_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_registration_link_info(text) TO anon, authenticated;

-- 2) Helper to validate that a tenant has an active registration link (used by RLS)
CREATE OR REPLACE FUNCTION public.tenant_has_active_registration_link(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registration_links rl
    WHERE rl.tenant_id = p_tenant_id
      AND rl.is_active = true
      AND (rl.expires_at IS NULL OR rl.expires_at > now())
  );
$$;

REVOKE ALL ON FUNCTION public.tenant_has_active_registration_link(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tenant_has_active_registration_link(uuid) TO anon, authenticated;

-- 3) Drop the broad anon SELECT on registration_links (anon now uses RPC)
DROP POLICY IF EXISTS "Anon view active links by slug" ON public.registration_links;

-- 4) Replace the contacts anon insert policy to use the security-definer helper
DROP POLICY IF EXISTS "Anon insert contact via registration link" ON public.contacts;
CREATE POLICY "Anon insert contact via registration link"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (public.tenant_has_active_registration_link(tenant_id));

-- 5) Replace the tenants anon SELECT to use the helper (it already uses EXISTS on registration_links,
--    but anon no longer has SELECT on that table; switch to security-definer helper)
DROP POLICY IF EXISTS "Anon view tenant via registration link" ON public.tenants;
CREATE POLICY "Anon view tenant via registration link"
ON public.tenants
FOR SELECT
TO anon
USING (public.tenant_has_active_registration_link(id));

-- 6) Restrict role enumeration: only super_admin, admin_gabinete, or the user themself
DROP POLICY IF EXISTS "View roles" ON public.user_roles;
CREATE POLICY "View own role or admin views tenant roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    public.has_role(auth.uid(), 'admin_gabinete'::app_role)
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- 7) Lock down SECURITY DEFINER helpers from being publicly callable
REVOKE ALL ON FUNCTION public.encrypt_sensitive(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrypt_sensitive(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.encryption_key() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_chat_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_tenant_id(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
