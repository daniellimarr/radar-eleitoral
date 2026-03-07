
-- Drop the restrictive ALL policy and replace with permissive ones
DROP POLICY IF EXISTS "Tenant manage links" ON public.registration_links;

-- Permissive INSERT policy
CREATE POLICY "Tenant insert links"
ON public.registration_links
FOR INSERT TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Permissive UPDATE policy
CREATE POLICY "Tenant update links"
ON public.registration_links
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Permissive DELETE policy
CREATE POLICY "Tenant delete links"
ON public.registration_links
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));
