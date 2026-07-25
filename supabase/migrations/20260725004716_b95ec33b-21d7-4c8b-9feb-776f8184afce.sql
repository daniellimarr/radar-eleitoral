CREATE OR REPLACE FUNCTION public.notify_new_visit_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_name text;
BEGIN
  IF NEW.requested_by IS NOT NULL THEN
    SELECT COALESCE(full_name, 'Usuário') INTO _user_name
    FROM public.profiles
    WHERE user_id = NEW.requested_by
    LIMIT 1;
  END IF;

  _user_name := COALESCE(NULLIF(_user_name, ''), NULLIF(NEW.requester_name, ''), 'Solicitante');

  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Nova solicitação de visita',
    _user_name || ' solicitou visita: ' || COALESCE(NULLIF(NEW.title, ''), 'Sem assunto'),
    'visit_request',
    NEW.requested_by
  );

  RETURN NEW;
END;
$function$;