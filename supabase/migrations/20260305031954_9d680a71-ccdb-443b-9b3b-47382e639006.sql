
-- Trigger: notificar admins/coords quando operador cadastrar contato
CREATE TRIGGER trigger_notify_new_contact_by_operator
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_contact_by_operator();

-- Função: notificar admins/coords sobre nova solicitação de visita
CREATE OR REPLACE FUNCTION public.notify_new_visit_request()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _user_name text;
BEGIN
  SELECT COALESCE(full_name, 'Usuário') INTO _user_name
  FROM public.profiles WHERE user_id = NEW.requested_by LIMIT 1;

  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Nova solicitação de visita',
    _user_name || ' solicitou visita: ' || NEW.title,
    'visit_request',
    NEW.requested_by
  );

  RETURN NEW;
END;
$function$;

-- Trigger: notificar sobre novas solicitações de visita
CREATE TRIGGER trigger_notify_new_visit_request
  AFTER INSERT ON public.visit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_visit_request();
