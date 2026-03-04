
-- Drop existing update and delete policies on contacts
DROP POLICY IF EXISTS "Tenant users update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users delete contacts" ON public.contacts;

-- Recreate UPDATE policy excluding operador
CREATE POLICY "Tenant users update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND NOT has_role(auth.uid(), 'operador'::app_role)
);

-- Recreate DELETE policy excluding operador
CREATE POLICY "Tenant users delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND NOT has_role(auth.uid(), 'operador'::app_role)
);
