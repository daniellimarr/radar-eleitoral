-- Security Hardening: Set search_path for all SECURITY DEFINER functions
-- This is a critical security measure to prevent search path hijacking.

ALTER FUNCTION public.encrypt_donation_fields() SET search_path = public;
ALTER FUNCTION public.notify_new_leader() SET search_path = public;
ALTER FUNCTION public.notify_new_appointment() SET search_path = public;
ALTER FUNCTION public.get_leader_name_for_link(text) SET search_path = public;
ALTER FUNCTION public.notify_new_visit_request() SET search_path = public;
ALTER FUNCTION public.encrypt_contact_fields() SET search_path = public;
ALTER FUNCTION public.notify_new_demand() SET search_path = public;
ALTER FUNCTION public.encrypt_sensitive(text) SET search_path = public;
ALTER FUNCTION public.is_chat_participant(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.notify_new_expense() SET search_path = public;
ALTER FUNCTION public.notify_new_contact() SET search_path = public;
ALTER FUNCTION public.tenant_has_active_registration_link(uuid) SET search_path = public;
ALTER FUNCTION public.get_registration_link_info(text) SET search_path = public;
ALTER FUNCTION public.encryption_key() SET search_path = public;
ALTER FUNCTION public.notify_new_user_registration() SET search_path = public;
ALTER FUNCTION public.notify_visit_request_status() SET search_path = public;
ALTER FUNCTION public.notify_new_donation() SET search_path = public;
ALTER FUNCTION public.decrypt_sensitive(text) SET search_path = public;
ALTER FUNCTION public.sync_profile_email() SET search_path = public;
ALTER FUNCTION public.notify_new_contact_by_operator() SET search_path = public;
ALTER FUNCTION public.notify_demand_completed() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
