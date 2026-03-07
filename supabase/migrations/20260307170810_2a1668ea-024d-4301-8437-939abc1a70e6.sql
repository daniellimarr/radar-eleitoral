
-- Add permissive SELECT policy for anon on registration_links
CREATE POLICY "Anon view active links"
ON public.registration_links
FOR SELECT
TO anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Add permissive SELECT policy for anon on tenants (only via active registration link)
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

-- Add permissive SELECT policy for anon on contacts (only leaders linked to active registration links)
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

-- Allow anon to insert contacts via active registration links (public registration)
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
