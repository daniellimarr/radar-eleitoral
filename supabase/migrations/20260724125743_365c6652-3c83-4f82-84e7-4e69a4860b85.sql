REVOKE ALL ON FUNCTION public.normalize_contact_empty_dates() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.normalize_contact_empty_dates() FROM anon;
REVOKE ALL ON FUNCTION public.normalize_contact_empty_dates() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_contact_empty_dates() TO service_role;