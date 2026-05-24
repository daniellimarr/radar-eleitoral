-- Create a security definer function to break recursion in contacts RLS
CREATE OR REPLACE FUNCTION public.get_user_leader_contact_ids(_user_id uuid)
RETURNS TABLE (contact_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.contact_id
  FROM public.leaders l
  JOIN public.contacts lc ON lc.id = l.contact_id
  JOIN public.profiles p ON (
    lower(COALESCE(p.full_name, '')) = lower(COALESCE(lc.name, '')) OR 
    lower(COALESCE(p.full_name, '')) = lower(COALESCE(lc.nickname, ''))
  )
  WHERE p.user_id = _user_id 
    AND lc.deleted_at IS NULL;
$$;

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;

CREATE POLICY "Tenant users view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'admin_gabinete') OR 
  has_role(auth.uid(), 'coordenador') OR 
  has_role(auth.uid(), 'assessor') OR 
  (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (
      NOT has_role(auth.uid(), 'operador') OR 
      registered_by = auth.uid() OR 
      id IN (SELECT contact_id FROM get_user_leader_contact_ids(auth.uid())) OR 
      leader_id IN (SELECT contact_id FROM get_user_leader_contact_ids(auth.uid()))
    )
  )
);
