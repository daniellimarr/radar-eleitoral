CREATE TABLE public.electoral_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  uf text NOT NULL DEFAULT 'RR',
  city text,
  zone text NOT NULL,
  section text NOT NULL,
  location_name text,
  address text,
  neighborhood text,
  registered_voters integer NOT NULL DEFAULT 0,
  last_election_votes integer,
  vote_goal integer,
  latitude double precision,
  longitude double precision,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT electoral_sections_unique UNIQUE (tenant_id, uf, zone, section)
);

CREATE INDEX idx_electoral_sections_tenant ON public.electoral_sections(tenant_id);
CREATE INDEX idx_electoral_sections_zone ON public.electoral_sections(tenant_id, zone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.electoral_sections TO authenticated;
GRANT ALL ON public.electoral_sections TO service_role;

ALTER TABLE public.electoral_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members manage electoral sections"
ON public.electoral_sections FOR ALL TO authenticated
USING (NOT public.is_developer(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
WITH CHECK (NOT public.is_developer(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_electoral_sections_updated_at
BEFORE UPDATE ON public.electoral_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_electoral_map(_tenant_id uuid)
RETURNS TABLE (
  id uuid, uf text, city text, zone text, section text,
  location_name text, address text, neighborhood text,
  registered_voters integer, last_election_votes integer, vote_goal integer,
  latitude double precision, longitude double precision,
  contacts_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.uf, s.city, s.zone, s.section, s.location_name, s.address, s.neighborhood,
         s.registered_voters, s.last_election_votes, s.vote_goal, s.latitude, s.longitude,
         COALESCE(c.cnt, 0) AS contacts_count
  FROM public.electoral_sections s
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.contacts ct
    WHERE ct.tenant_id = s.tenant_id
      AND ct.deleted_at IS NULL
      AND lpad(regexp_replace(COALESCE(ct.voting_zone,''), '\D', '', 'g'), 4, '0') = lpad(regexp_replace(s.zone, '\D', '', 'g'), 4, '0')
      AND lpad(regexp_replace(COALESCE(ct.voting_section,''), '\D', '', 'g'), 4, '0') = lpad(regexp_replace(s.section, '\D', '', 'g'), 4, '0')
      AND COALESCE(ct.voting_zone,'') <> '' AND COALESCE(ct.voting_section,'') <> ''
  ) c ON true
  WHERE s.tenant_id = _tenant_id
    AND NOT public.is_developer(auth.uid())
    AND s.tenant_id = public.get_user_tenant_id(auth.uid())
  ORDER BY s.city NULLS LAST, s.zone, s.section;
$$;

GRANT EXECUTE ON FUNCTION public.get_electoral_map(uuid) TO authenticated;