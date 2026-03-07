
-- Drop restrictive anon policies and recreate as permissive

-- registration_links
DROP POLICY IF EXISTS "Anon view active links" ON public.registration_links;
CREATE POLICY "Anon view active links"
ON public.registration_links
FOR SELECT
TO anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- tenants
DROP POLICY IF EXISTS "Anon view tenant via registration link" ON public.tenants;
CREATE POLICY "Anon view tenant via registration link"
ON public.tenants
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.registration_links rl
    WHERE rl.tenant_id = tenants.id
      AND rl.is_active = true
      AND (rl.expires_at IS NULL OR rl.expires_at > now())
  )
);

-- contacts SELECT for anon
DROP POLICY IF EXISTS "Anon view leader via registration link" ON public.contacts;
CREATE POLICY "Anon view leader via registration link"
ON public.contacts
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.registration_links rl
    WHERE rl.leader_contact_id = contacts.id
      AND rl.is_active = true
      AND (rl.expires_at IS NULL OR rl.expires_at > now())
  )
);

-- contacts INSERT for anon - drop both duplicates and recreate one permissive
DROP POLICY IF EXISTS "Anon insert contact via registration link" ON public.contacts;
DROP POLICY IF EXISTS "Public registration via link" ON public.contacts;
CREATE POLICY "Anon insert contact via registration link"
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
);
