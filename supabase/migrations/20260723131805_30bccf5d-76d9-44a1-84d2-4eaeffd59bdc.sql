
-- 1) Tighten anon INSERT on contacts: enforce safe defaults
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
  AND COALESCE(is_leader, false) = false
  AND category IS NULL
  AND registered_by IS NULL
  AND COALESCE(engagement, 'nao_trabalhado') = 'nao_trabalhado'
);

-- 2) Remove anon SELECT on registration_links (public page uses SECURITY DEFINER RPC)
DROP POLICY IF EXISTS "Allow anonymous to view active registration links" ON public.registration_links;
