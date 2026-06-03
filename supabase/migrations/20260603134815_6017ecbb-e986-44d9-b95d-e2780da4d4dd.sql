-- Drop existing policies
DROP POLICY IF EXISTS "Tenant manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;

-- Recreate "Tenant manage contacts" without super_admin
CREATE POLICY "Tenant manage contacts"
ON public.contacts
FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Recreate "Tenant users view contacts" without super_admin
CREATE POLICY "Tenant users view contacts"
ON public.contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin_gabinete'::app_role) OR 
  has_role(auth.uid(), 'coordenador'::app_role) OR 
  has_role(auth.uid(), 'assessor'::app_role) OR 
  (
    (tenant_id = get_user_tenant_id(auth.uid())) AND 
    (
      (NOT has_role(auth.uid(), 'operador'::app_role)) OR 
      (registered_by = auth.uid()) OR 
      (id IN (SELECT contact_id FROM get_user_leader_contact_ids(auth.uid()))) OR 
      (leader_id IN (SELECT contact_id FROM get_user_leader_contact_ids(auth.uid())))
    )
  )
);
