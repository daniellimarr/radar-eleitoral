-- Corrigindo search_path para funções SECURITY DEFINER com argumentos corretos
ALTER FUNCTION public.notify_new_leader() SET search_path = public;
ALTER FUNCTION public.notify_new_appointment() SET search_path = public;
ALTER FUNCTION public.encrypt_donation_fields() SET search_path = public;
ALTER FUNCTION public.encrypt_contact_fields() SET search_path = public;
ALTER FUNCTION public.get_leader_name_for_link(text) SET search_path = public;
ALTER FUNCTION public.notify_new_visit_request() SET search_path = public;
ALTER FUNCTION public.encrypt_sensitive(text) SET search_path = public;
ALTER FUNCTION public.is_chat_participant(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.notify_new_contact() SET search_path = public;
ALTER FUNCTION public.tenant_has_active_registration_link(uuid) SET search_path = public;
ALTER FUNCTION public.get_registration_link_info(text) SET search_path = public;
ALTER FUNCTION public.notify_new_demand() SET search_path = public;
ALTER FUNCTION public.encryption_key() SET search_path = public;
ALTER FUNCTION public.notify_visit_request_status() SET search_path = public;
ALTER FUNCTION public.notify_new_donation() SET search_path = public;
ALTER FUNCTION public.decrypt_sensitive(text) SET search_path = public;
ALTER FUNCTION public.notify_new_user_registration() SET search_path = public;
ALTER FUNCTION public.sync_profile_email() SET search_path = public;
ALTER FUNCTION public.notify_new_contact_by_operator() SET search_path = public;
ALTER FUNCTION public.notify_new_expense() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.notify_demand_completed() SET search_path = public;

-- Adicionando search_path para funções que não tinham
ALTER FUNCTION public.get_user_tenant_id(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.increment_link_uses() SET search_path = public;

-- Ajustando a view profiles_safe para SECURITY INVOKER
-- Removemos e recriamos para garantir a ordem correta das colunas e a nova propriedade
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe 
WITH (security_invoker = true)
AS SELECT 
  id, 
  user_id, 
  tenant_id, 
  full_name, 
  created_at, 
  updated_at, 
  avatar_url, 
  email, 
  phone, 
  status 
FROM public.profiles;
