CREATE OR REPLACE FUNCTION public.is_nps_survey_open(p_survey_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.nps_surveys s
    WHERE s.id = p_survey_id
      AND s.tenant_id = p_tenant_id
      AND s.status = 'ativa'
      AND (s.start_date IS NULL OR s.start_date <= CURRENT_DATE)
      AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_nps_survey_open(uuid, uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Public submit nps responses" ON public.nps_responses;
CREATE POLICY "Public submit nps responses"
ON public.nps_responses FOR INSERT TO anon, authenticated
WITH CHECK (public.is_nps_survey_open(survey_id, tenant_id));

GRANT INSERT ON public.nps_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_responses TO authenticated;
GRANT ALL ON public.nps_responses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_surveys TO authenticated;
GRANT ALL ON public.nps_surveys TO service_role;