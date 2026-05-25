-- Add link_type column to registration_links
ALTER TABLE public.registration_links 
ADD COLUMN link_type TEXT DEFAULT 'voter' CHECK (link_type IN ('voter', 'leader'));

-- Drop and recreate the function to include link_type
DROP FUNCTION IF EXISTS public.get_registration_link_info(text);

CREATE OR REPLACE FUNCTION public.get_registration_link_info(p_slug text)
 RETURNS TABLE(tenant_id uuid, tenant_name text, leader_contact_id uuid, leader_name text, link_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT rl.tenant_id,
         t.name AS tenant_name,
         rl.leader_contact_id,
         c.name AS leader_name,
         rl.link_type
  FROM public.registration_links rl
  LEFT JOIN public.tenants t ON t.id = rl.tenant_id
  LEFT JOIN public.contacts c ON c.id = rl.leader_contact_id
  WHERE rl.slug = p_slug
    AND rl.is_active = true
    AND (rl.expires_at IS NULL OR rl.expires_at > now())
  LIMIT 1;
$function$;
