
-- Lock down all SECURITY DEFINER trigger/helper functions from public/anon/authenticated execution.
-- Triggers still run with definer privileges regardless of EXECUTE grants.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname NOT IN (
        'get_registration_link_info',
        'get_leader_name_for_link',
        'tenant_has_active_registration_link',
        'has_role',
        'get_user_tenant_id',
        'is_chat_participant'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;', r.proname, r.args);
  END LOOP;
END $$;
