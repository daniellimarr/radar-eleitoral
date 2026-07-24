
ALTER TABLE public.visit_requests
  ALTER COLUMN requested_by DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS requester_name text,
  ADD COLUMN IF NOT EXISTS requester_phone text,
  ADD COLUMN IF NOT EXISTS requester_email text;

-- Public policy: anyone (anon) may INSERT a visit_request for a tenant that has an active public link
DROP POLICY IF EXISTS "Public can create visit requests via active link" ON public.visit_requests;
CREATE POLICY "Public can create visit requests via active link"
ON public.visit_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  requested_by IS NULL
  AND public.tenant_has_active_registration_link(tenant_id)
);

GRANT INSERT ON public.visit_requests TO anon;

-- Public RPC: return busy slots (date + time) for a tenant, safe for anon.
CREATE OR REPLACE FUNCTION public.get_tenant_busy_slots(p_tenant_id uuid)
RETURNS TABLE(slot timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT requested_date
  FROM public.visit_requests
  WHERE tenant_id = p_tenant_id
    AND requested_date IS NOT NULL
    AND COALESCE(status,'') NOT IN ('rejeitado','rejeitada','cancelado','cancelada');
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_busy_slots(uuid) TO anon, authenticated;
