
DROP POLICY IF EXISTS "Tenant view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admin manage campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can view campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
