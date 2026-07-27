CREATE OR REPLACE FUNCTION public.tenant_has_active_leader_link(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registration_links rl
    WHERE rl.tenant_id = p_tenant_id
      AND rl.is_active = true
      AND rl.link_type = 'leader'
      AND (rl.expires_at IS NULL OR rl.expires_at > now())
  );
$$;

DROP POLICY IF EXISTS "Public registration via link" ON public.contacts;

CREATE POLICY "Public registration via link"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (
  public.tenant_has_active_registration_link(tenant_id)
  AND category IS NULL
  AND registered_by IS NULL
  AND COALESCE(engagement, 'nao_trabalhado'::engagement_level) = 'nao_trabalhado'::engagement_level
  AND (
    COALESCE(is_leader, false) = false
    OR public.tenant_has_active_leader_link(tenant_id)
  )
);