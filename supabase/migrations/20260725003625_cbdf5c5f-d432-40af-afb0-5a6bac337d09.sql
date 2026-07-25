GRANT INSERT ON public.visit_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_requests TO authenticated;
GRANT ALL ON public.visit_requests TO service_role;