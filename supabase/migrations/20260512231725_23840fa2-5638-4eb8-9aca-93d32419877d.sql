
-- 1. Fix Mutable Search Path (Linter 0011)
ALTER FUNCTION public.safe_uuid(text) SET search_path = public;

-- For encryption_key, it already has [public, vault], ensuring it's secure.
-- Let's re-apply to be sure for all identified in linter.
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. Revoke Execute from Public/Anon/Authenticated for SECURITY DEFINER functions (Linter 0028/0029)
-- First, a blanket revoke for safety on the public schema for these roles
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- 3. Grant back only what's necessary for the App to function
-- Auth & RBAC (Required for RLS and UI)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) TO authenticated;

-- Public Registration Flow (Required for /cadastro/:slug)
GRANT EXECUTE ON FUNCTION public.get_registration_link_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_leader_name_for_link(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_has_active_registration_link(uuid) TO anon, authenticated;

-- Utility
GRANT EXECUTE ON FUNCTION public.safe_uuid(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- Sensitive functions (encrypt/decrypt/triggers) should NOT be granted to authenticated/anon.
-- They will still work when called by Triggers (Security Definer) or via Service Role.

-- Re-verify that internal helpers used by RLS are accessible to the roles that need them.
-- profiles, contacts, etc use get_user_tenant_id and has_role.
