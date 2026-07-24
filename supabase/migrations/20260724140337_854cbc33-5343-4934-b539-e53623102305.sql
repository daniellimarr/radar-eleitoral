CREATE OR REPLACE FUNCTION public.get_tenant_leaders(p_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  nickname text,
  gender text,
  birth_date date,
  phone text,
  has_whatsapp boolean,
  cep text,
  address text,
  address_number text,
  neighborhood text,
  city text,
  state text,
  voting_zone text,
  voting_section text,
  voting_location text,
  engagement public.engagement_level,
  is_leader boolean,
  leader_id uuid,
  tenant_id uuid,
  registered_by uuid,
  latitude double precision,
  longitude double precision,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    c.id,
    c.name,
    c.nickname,
    c.gender,
    c.birth_date,
    public.decrypt_sensitive(c.phone) AS phone,
    c.has_whatsapp,
    c.cep,
    c.address,
    c.address_number,
    c.neighborhood,
    c.city,
    c.state,
    c.voting_zone,
    c.voting_section,
    c.voting_location,
    c.engagement,
    c.is_leader,
    c.leader_id,
    c.tenant_id,
    c.registered_by,
    c.latitude,
    c.longitude,
    c.created_at,
    c.updated_at,
    c.deleted_at
  FROM public.contacts c
  WHERE c.tenant_id = p_tenant_id
    AND c.deleted_at IS NULL
    AND c.is_leader IS TRUE
    AND p_tenant_id = public.get_user_tenant_id(auth.uid())
  ORDER BY c.name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_leaders(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_leaders(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_leaders(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_leader_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_leader = true THEN
    INSERT INTO public.leaders (contact_id, tenant_id)
    VALUES (NEW.id, NEW.tenant_id)
    ON CONFLICT (contact_id) DO UPDATE
      SET tenant_id = EXCLUDED.tenant_id,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_new_leader_contact ON public.contacts;
CREATE TRIGGER on_new_leader_contact
AFTER INSERT OR UPDATE OF is_leader, tenant_id ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_leader_contact();