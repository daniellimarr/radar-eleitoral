
-- 1. Restrict anon insert on contacts to safe values only
DROP POLICY IF EXISTS "Anon insert contact via registration link" ON public.contacts;

CREATE POLICY "Anon insert contact via registration link"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (
  public.tenant_has_active_registration_link(tenant_id)
  AND is_leader = false
  AND registered_by IS NULL
  AND engagement = 'nao_trabalhado'::engagement_level
  AND category IS NULL
  AND subcategory IS NULL
  AND (tags IS NULL OR cardinality(tags) = 0)
);

-- 2. Prevent admin_gabinete from modifying/deleting their own role row
DROP POLICY IF EXISTS "Admin manages roles" ON public.user_roles;

CREATE POLICY "Admin manages roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    has_role(auth.uid(), 'admin_gabinete'::app_role)
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND tenant_id = get_user_tenant_id(user_id)
    AND role = ANY (ARRAY['operador'::app_role, 'assessor'::app_role, 'coordenador'::app_role])
    AND user_id <> auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    has_role(auth.uid(), 'admin_gabinete'::app_role)
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND tenant_id = get_user_tenant_id(user_id)
    AND role = ANY (ARRAY['operador'::app_role, 'assessor'::app_role, 'coordenador'::app_role])
    AND user_id <> auth.uid()
  )
);
