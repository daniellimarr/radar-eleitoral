
-- 1) Fix get_user_tenant_id to return NULL for unauthenticated callers
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$function$;

-- 2) Restrict contacts tenant policies to authenticated role only
DROP POLICY IF EXISTS "Tenant manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;

CREATE POLICY "Tenant users view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant manage contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
