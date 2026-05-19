-- Fix SECURITY DEFINER functions by setting search_path
ALTER FUNCTION public.notify_new_leader() SET search_path = public;
ALTER FUNCTION public.notify_new_appointment() SET search_path = public;
ALTER FUNCTION public.encrypt_donation_fields() SET search_path = public;
ALTER FUNCTION public.encrypt_contact_fields() SET search_path = public;
ALTER FUNCTION public.get_leader_name_for_link(TEXT) SET search_path = public;
ALTER FUNCTION public.encrypt_sensitive(TEXT) SET search_path = public;
ALTER FUNCTION public.notify_new_visit_request() SET search_path = public;
ALTER FUNCTION public.is_chat_participant(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.notify_new_contact() SET search_path = public;
ALTER FUNCTION public.tenant_has_active_registration_link(UUID) SET search_path = public;
ALTER FUNCTION public.get_registration_link_info(TEXT) SET search_path = public;
ALTER FUNCTION public.notify_new_demand() SET search_path = public;
ALTER FUNCTION public.encryption_key() SET search_path = public;
ALTER FUNCTION public.notify_visit_request_status() SET search_path = public;
ALTER FUNCTION public.notify_new_donation() SET search_path = public;
ALTER FUNCTION public.decrypt_sensitive(TEXT) SET search_path = public;
ALTER FUNCTION public.notify_new_user_registration() SET search_path = public;
ALTER FUNCTION public.sync_profile_email() SET search_path = public;
ALTER FUNCTION public.notify_new_contact_by_operator() SET search_path = public;
ALTER FUNCTION public.notify_new_expense() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.notify_demand_completed() SET search_path = public;

-- Revoke public execute from sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.encryption_key() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive(TEXT) FROM PUBLIC;

-- Add RLS Policies for sensitive metadata tables
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "System manages login attempts" ON public.login_attempts;
CREATE POLICY "System manages login attempts" 
ON public.login_attempts FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));
