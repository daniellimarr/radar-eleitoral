
-- Drop the existing public registration INSERT policy and recreate with anon role explicitly
DROP POLICY IF EXISTS "Public registration via link" ON public.contacts;

-- Recreate: allow anon users to INSERT only when a valid registration link exists
CREATE POLICY "Public registration via link"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registration_links
    WHERE registration_links.tenant_id = contacts.tenant_id
      AND registration_links.is_active = true
      AND (registration_links.expires_at IS NULL OR registration_links.expires_at > now())
  )
);

-- Ensure no SELECT policy exists for anon role (all existing SELECT policies already require auth)
-- Add explicit denial: anon users cannot read contacts
-- (RLS is already enabled and existing SELECT policies use auth.uid(), so anon is blocked by default,
--  but let's be explicit by ensuring the policies use 'TO authenticated')

-- Recreate the tenant view policy explicitly for authenticated only
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;
CREATE POLICY "Tenant users view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  ((tenant_id = get_user_tenant_id(auth.uid()))
    AND (NOT has_role(auth.uid(), 'operador'::app_role) OR registered_by = auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
