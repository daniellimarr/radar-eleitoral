GRANT EXECUTE ON FUNCTION public.decrypt_sensitive(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.encryption_key() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated, anon;
