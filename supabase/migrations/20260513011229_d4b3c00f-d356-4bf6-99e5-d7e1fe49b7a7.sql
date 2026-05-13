-- Security Hardening: Revoke default execution permissions from PUBLIC for SECURITY DEFINER functions
-- and only grant back to specific roles where necessary.

-- 1. Revoke execution from everyone for all identified SECURITY DEFINER functions in public schema
REVOKE EXECUTE ON FUNCTION public.encrypt_donation_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_leader() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_appointment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_leader_name_for_link(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_visit_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_contact_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_demand() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_expense() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tenant_has_active_registration_link(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_registration_link_info(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encryption_key() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_user_registration() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_visit_request_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_donation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_contact_by_operator() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_demand_completed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Grant access back only to what is strictly necessary

-- RPCs needed for registration (can be called by anonymous users)
GRANT EXECUTE ON FUNCTION public.get_registration_link_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_has_active_registration_link(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_leader_name_for_link(text) TO anon, authenticated;

-- RLS helper needed for chat access
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid, uuid) TO authenticated;

-- Trigger functions on tables that users can modify
-- Users need EXECUTE permission to trigger these functions during INSERT/UPDATE/DELETE
GRANT EXECUTE ON FUNCTION public.notify_new_user_registration() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_contact_by_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_visit_request() TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_contact_fields() TO authenticated, anon; -- anon can insert via registration link
GRANT EXECUTE ON FUNCTION public.notify_new_demand() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_demand_completed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_leader() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_donation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_expense() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_appointment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_visit_request_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_contact() TO authenticated, anon; -- anon can insert via registration link
GRANT EXECUTE ON FUNCTION public.encrypt_donation_fields() TO authenticated;

-- Functions that remain restricted (only callable by postgres/service_role):
-- encryption_key, encrypt_sensitive, decrypt_sensitive, sync_profile_email, handle_new_user
