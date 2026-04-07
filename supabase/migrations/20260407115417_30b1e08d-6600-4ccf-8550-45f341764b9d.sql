-- Fix registration_links: drop overly permissive policies
DROP POLICY IF EXISTS "Anon view active links" ON public.registration_links;
DROP POLICY IF EXISTS "Public view active links" ON public.registration_links;

-- Anon: only allow selecting active links (needed for public registration page)
CREATE POLICY "Anon view active links by slug"
ON public.registration_links
FOR SELECT
TO anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Authenticated: only own tenant
CREATE POLICY "Authenticated view own tenant links"
ON public.registration_links
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Fix payments INSERT policy
DROP POLICY IF EXISTS "Authenticated insert payments" ON public.payments;
CREATE POLICY "Authenticated insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
);

-- Fix storage: add UPDATE policy for campaign-files
CREATE POLICY "Tenant members can update campaign files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaign-files'
  AND (storage.foldername(name))[1] = (SELECT get_user_tenant_id(auth.uid()))::text
)
WITH CHECK (
  bucket_id = 'campaign-files'
  AND (storage.foldername(name))[1] = (SELECT get_user_tenant_id(auth.uid()))::text
);