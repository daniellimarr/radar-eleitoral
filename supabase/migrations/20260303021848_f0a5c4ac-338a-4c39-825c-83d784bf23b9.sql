
-- Table for WhatsApp automation configurations
CREATE TABLE public.whatsapp_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Aniversariantes',
  message_template TEXT NOT NULL DEFAULT 'Feliz aniversário, {nome}! 🎂🎉',
  schedule_time TEXT DEFAULT '08:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  include_variable TEXT DEFAULT 'nome',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for WhatsApp message send logs
CREATE TABLE public.whatsapp_send_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES public.whatsapp_automations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Only coordenador+ can manage automations
CREATE POLICY "Admin manage whatsapp_automations"
ON public.whatsapp_automations FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

CREATE POLICY "Admin view whatsapp_automations"
ON public.whatsapp_automations FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- RLS for send logs
CREATE POLICY "Admin manage whatsapp_send_logs"
ON public.whatsapp_send_logs FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

CREATE POLICY "Admin view whatsapp_send_logs"
ON public.whatsapp_send_logs FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_automations_updated_at
BEFORE UPDATE ON public.whatsapp_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
