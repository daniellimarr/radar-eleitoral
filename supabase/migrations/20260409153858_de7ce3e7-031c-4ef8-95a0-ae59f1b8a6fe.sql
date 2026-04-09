
-- Allow all authenticated users to view profiles within their own tenant (needed for chat)
CREATE POLICY "Tenant members view tenant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));
