
-- Drop existing SELECT policy on contacts
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;

-- Recreate: non-operators see all tenant contacts, operators see only their own
CREATE POLICY "Tenant users view contacts"
ON public.contacts
FOR SELECT
USING (
  (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      NOT has_role(auth.uid(), 'operador'::app_role)
      OR registered_by = auth.uid()
    )
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
