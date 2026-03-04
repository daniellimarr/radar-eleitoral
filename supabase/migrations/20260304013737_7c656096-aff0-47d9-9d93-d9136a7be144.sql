
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins and coordinators can view notifications for their tenant
CREATE POLICY "Admin/coord view notifications"
ON public.notifications
FOR SELECT
USING (
  (tenant_id = get_user_tenant_id(auth.uid()))
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- Admins and coordinators can update (mark as read)
CREATE POLICY "Admin/coord update notifications"
ON public.notifications
FOR UPDATE
USING (
  (tenant_id = get_user_tenant_id(auth.uid()))
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- Anyone authenticated can insert notifications (trigger runs as the inserting user)
CREATE POLICY "Authenticated insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Create trigger function to notify on new contact by operator
CREATE OR REPLACE FUNCTION public.notify_new_contact_by_operator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_operator boolean;
  _user_name text;
BEGIN
  -- Check if the inserting user is an operator
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'operador'
  ) INTO _is_operator;

  IF _is_operator THEN
    -- Get operator name
    SELECT COALESCE(full_name, 'Operador') INTO _user_name
    FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

    INSERT INTO public.notifications (tenant_id, title, message, type, created_by)
    VALUES (
      NEW.tenant_id,
      'Novo cadastro por operador',
      _user_name || ' cadastrou: ' || NEW.name,
      'new_contact',
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to contacts table
CREATE TRIGGER on_contact_insert_notify
AFTER INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_contact_by_operator();
