
-- Recriar a view com security_invoker para respeitar RLS do chamador
DROP VIEW IF EXISTS public.donations_safe;

CREATE VIEW public.donations_safe 
WITH (security_invoker = true)
AS
SELECT 
  id, tenant_id, campaign_id, nome_doador, 
  CASE 
    WHEN (public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'admin_gabinete'::app_role)) 
    THEN cpf_cnpj 
    ELSE NULL 
  END as cpf_cnpj,
  tipo, valor, data, forma_pagamento, comprovante_url, created_at, updated_at
FROM public.donations;

ALTER VIEW public.donations_safe OWNER TO postgres;
GRANT SELECT ON public.donations_safe TO authenticated;
