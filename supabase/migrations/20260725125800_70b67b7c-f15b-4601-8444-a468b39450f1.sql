CREATE TABLE public.nps_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','ativa','encerrada')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nps_surveys_tenant ON public.nps_surveys(tenant_id);
CREATE INDEX idx_nps_surveys_slug ON public.nps_surveys(slug);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nps_surveys TO authenticated;
GRANT SELECT ON public.nps_surveys TO anon;
GRANT ALL ON public.nps_surveys TO service_role;

ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view nps surveys" ON public.nps_surveys FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND NOT public.is_developer(auth.uid()));
CREATE POLICY "Tenant insert nps surveys" ON public.nps_surveys FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND NOT public.is_developer(auth.uid()));
CREATE POLICY "Tenant update nps surveys" ON public.nps_surveys FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND NOT public.is_developer(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND NOT public.is_developer(auth.uid()));
CREATE POLICY "Tenant delete nps surveys" ON public.nps_surveys FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND NOT public.is_developer(auth.uid()));
CREATE POLICY "Public read active nps surveys" ON public.nps_surveys FOR SELECT TO anon
  USING (status = 'ativa');

CREATE TABLE public.nps_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id uuid NOT NULL REFERENCES public.nps_surveys(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  main_topic text,
  respondent_name text,
  neighborhood text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nps_responses_survey ON public.nps_responses(survey_id);
CREATE INDEX idx_nps_responses_tenant ON public.nps_responses(tenant_id);

GRANT SELECT, DELETE ON public.nps_responses TO authenticated;
GRANT INSERT ON public.nps_responses TO anon, authenticated;
GRANT ALL ON public.nps_responses TO service_role;

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view nps responses" ON public.nps_responses FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND NOT public.is_developer(auth.uid()));
CREATE POLICY "Tenant delete nps responses" ON public.nps_responses FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND NOT public.is_developer(auth.uid()));
CREATE POLICY "Public submit nps responses" ON public.nps_responses FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.nps_surveys s
    WHERE s.id = survey_id
      AND s.tenant_id = nps_responses.tenant_id
      AND s.status = 'ativa'
      AND (s.start_date IS NULL OR s.start_date <= CURRENT_DATE)
      AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
  ));

CREATE TRIGGER update_nps_surveys_updated_at BEFORE UPDATE ON public.nps_surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();