
-- ==============================================
-- NOTIFICATION TRIGGERS FOR ALL KEY EVENTS
-- ==============================================

-- 1. NOVA DEMANDA CRIADA
CREATE OR REPLACE FUNCTION public.notify_new_demand()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name text;
BEGIN
  SELECT COALESCE(full_name, 'Usuário') INTO _user_name
  FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Nova demanda criada',
    COALESCE(_user_name, 'Usuário') || ' criou a demanda: ' || NEW.title,
    'new_demand',
    auth.uid()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_demand ON public.demands;
CREATE TRIGGER trigger_notify_new_demand
  AFTER INSERT ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_demand();

-- 2. DEMANDA CONCLUÍDA
CREATE OR REPLACE FUNCTION public.notify_demand_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM 'concluida' AND NEW.status = 'concluida' THEN
    SELECT COALESCE(full_name, 'Usuário') INTO _user_name
    FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

    INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
    VALUES (
      NEW.tenant_id,
      'Demanda concluída',
      'A demanda "' || NEW.title || '" foi concluída por ' || COALESCE(_user_name, 'Usuário'),
      'new_demand',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_demand_completed ON public.demands;
CREATE TRIGGER trigger_notify_demand_completed
  AFTER UPDATE ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_demand_completed();

-- 3. NOVO LÍDER CADASTRADO
CREATE OR REPLACE FUNCTION public.notify_new_leader()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contact_name text;
  _user_name text;
BEGIN
  SELECT name INTO _contact_name FROM public.contacts WHERE id = NEW.contact_id LIMIT 1;
  SELECT COALESCE(full_name, 'Usuário') INTO _user_name
  FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Novo líder cadastrado',
    COALESCE(_user_name, 'Usuário') || ' cadastrou o líder: ' || COALESCE(_contact_name, 'N/A'),
    'new_leader',
    auth.uid()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_leader ON public.leaders;
CREATE TRIGGER trigger_notify_new_leader
  AFTER INSERT ON public.leaders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_leader();

-- 4. NOVA DOAÇÃO RECEBIDA
CREATE OR REPLACE FUNCTION public.notify_new_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Nova doação recebida',
    'Doação de R$ ' || REPLACE(NEW.valor::text, '.', ',') || ' de ' || NEW.nome_doador,
    'financial',
    auth.uid()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_donation ON public.donations;
CREATE TRIGGER trigger_notify_new_donation
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_donation();

-- 5. NOVA DESPESA REGISTRADA
CREATE OR REPLACE FUNCTION public.notify_new_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Nova despesa registrada',
    'Despesa de R$ ' || REPLACE(NEW.valor::text, '.', ',') || ': ' || NEW.descricao,
    'financial',
    auth.uid()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_expense ON public.expenses;
CREATE TRIGGER trigger_notify_new_expense
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_expense();

-- 6. NOVO AGENDAMENTO
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name text;
BEGIN
  SELECT COALESCE(full_name, 'Usuário') INTO _user_name
  FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Novo agendamento',
    COALESCE(_user_name, 'Usuário') || ' criou o agendamento: ' || NEW.title,
    'info',
    auth.uid()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_appointment ON public.appointments;
CREATE TRIGGER trigger_notify_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_appointment();

-- 7. SOLICITAÇÃO DE VISITA APROVADA/REJEITADA
CREATE OR REPLACE FUNCTION public.notify_visit_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name text;
  _status_label text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('aprovada', 'rejeitada') THEN
    SELECT COALESCE(full_name, 'Usuário') INTO _user_name
    FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

    IF NEW.status = 'aprovada' THEN
      _status_label := 'aprovada';
    ELSE
      _status_label := 'rejeitada';
    END IF;

    INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
    VALUES (
      NEW.tenant_id,
      'Solicitação de visita ' || _status_label,
      'A visita "' || NEW.title || '" foi ' || _status_label || ' por ' || COALESCE(_user_name, 'Usuário'),
      'visit_request',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_visit_request_status ON public.visit_requests;
CREATE TRIGGER trigger_notify_visit_request_status
  AFTER UPDATE ON public.visit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_visit_request_status();

-- 8. NOVO CONTATO CADASTRADO (por qualquer usuário, não só operador)
CREATE OR REPLACE FUNCTION public.notify_new_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name text;
BEGIN
  SELECT COALESCE(full_name, 'Usuário') INTO _user_name
  FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
  VALUES (
    NEW.tenant_id,
    'Novo contato cadastrado',
    COALESCE(_user_name, 'Usuário') || ' cadastrou: ' || NEW.name,
    'new_contact',
    auth.uid()
  );
  RETURN NEW;
END;
$$;

-- Remove old operator-only triggers
DROP TRIGGER IF EXISTS on_contact_insert_notify ON public.contacts;
DROP TRIGGER IF EXISTS trigger_notify_new_contact_by_operator ON public.contacts;

CREATE TRIGGER trigger_notify_new_contact
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_contact();
