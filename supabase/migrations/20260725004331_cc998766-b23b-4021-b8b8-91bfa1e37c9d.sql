GRANT INSERT ON public.visit_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_requests TO authenticated;
GRANT ALL ON public.visit_requests TO service_role;

GRANT EXECUTE ON FUNCTION public.get_registration_link_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_busy_slots(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_has_active_registration_link(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Public can create visit requests via active link" ON public.visit_requests;
CREATE POLICY "Public can create visit requests via active link"
ON public.visit_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  requested_by IS NULL
  AND status = 'pendente'
  AND public.tenant_has_active_registration_link(tenant_id)
);