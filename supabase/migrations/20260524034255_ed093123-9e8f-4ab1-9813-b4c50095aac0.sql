-- Reactivate the main tenant if it was marked as deleted
UPDATE public.tenants 
SET deleted_at = NULL 
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update get_user_tenant_id to fallback to the main tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    'a0000000-0000-0000-0000-000000000001'::uuid
  );
$function$;

-- Update contacts RLS policies to allow super_admin bypass
DROP POLICY IF EXISTS "Tenant view contacts" ON public.contacts;
CREATE POLICY "Tenant view contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Tenant manage contacts" ON public.contacts;
CREATE POLICY "Tenant manage contacts" ON public.contacts
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
