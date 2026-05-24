DROP POLICY IF EXISTS "Tenant view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;

CREATE POLICY "Tenant users view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin_gabinete'::app_role)
  OR has_role(auth.uid(), 'coordenador'::app_role)
  OR has_role(auth.uid(), 'assessor'::app_role)
  OR (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      NOT has_role(auth.uid(), 'operador'::app_role)
      OR registered_by = auth.uid()
      OR id IN (
        SELECT l.contact_id
        FROM public.leaders l
        JOIN public.contacts lc ON lc.id = l.contact_id
        JOIN public.profiles p ON lower(coalesce(p.full_name, '')) = lower(coalesce(lc.name, ''))
           OR lower(coalesce(p.full_name, '')) = lower(coalesce(lc.nickname, ''))
        WHERE l.tenant_id = public.contacts.tenant_id
          AND p.user_id = auth.uid()
          AND lc.deleted_at IS NULL
      )
      OR leader_id IN (
        SELECT l.contact_id
        FROM public.leaders l
        JOIN public.contacts lc ON lc.id = l.contact_id
        JOIN public.profiles p ON lower(coalesce(p.full_name, '')) = lower(coalesce(lc.name, ''))
           OR lower(coalesce(p.full_name, '')) = lower(coalesce(lc.nickname, ''))
        WHERE l.tenant_id = public.contacts.tenant_id
          AND p.user_id = auth.uid()
          AND lc.deleted_at IS NULL
      )
    )
  )
);

DROP POLICY IF EXISTS "Public registration via link" ON public.contacts;
DROP POLICY IF EXISTS "Enable insertion for anonymous users via registration" ON public.contacts;
CREATE POLICY "Public registration via link"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.registration_links rl
    WHERE rl.tenant_id = contacts.tenant_id
      AND rl.is_active = true
      AND (rl.expires_at IS NULL OR rl.expires_at > now())
  )
);