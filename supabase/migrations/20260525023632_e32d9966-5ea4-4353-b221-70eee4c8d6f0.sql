GRANT SELECT ON public.contacts TO authenticated, anon;
GRANT SELECT ON public.contacts_decrypted TO authenticated, anon;
GRANT ALL ON public.contacts TO authenticated, anon;
GRANT ALL ON public.contacts_decrypted TO authenticated, anon;

-- Also check user_roles and profiles just in case
GRANT SELECT ON public.user_roles TO authenticated, anon;
GRANT SELECT ON public.profiles TO authenticated, anon;
GRANT SELECT ON public.tenants TO authenticated, anon;
