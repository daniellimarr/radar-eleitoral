
-- 1. Revogar SELECT público na tabela base para garantir que o controle de colunas funcione
REVOKE SELECT ON public.donations FROM authenticated;

-- 2. Conceder acesso a todas as colunas apenas para super_admin e admin_gabinete
-- (Isso exige que a aplicação use roles específicas ou que façamos via RLS + View)
-- Como o sistema usa o role 'authenticated' do Supabase para todos, a melhor abordagem é:
-- Manter a RLS para filtrar as LINHAS e usar Column-level GRANTs ou uma View para as COLUNAS.

-- Conceder colunas seguras para todos os autenticados (que passarem pela RLS)
GRANT SELECT (
  id, tenant_id, campaign_id, nome_doador, tipo, valor, data, 
  forma_pagamento, comprovante_url, created_at, updated_at
) ON public.donations TO authenticated;

-- Conceder coluna sensível apenas se o usuário for admin ou superior
-- Nota: O Postgres não permite GRANT condicional por valor de role da nossa tabela user_roles diretamente no GRANT.
-- Portanto, a solução recomendada é usar uma VIEW segura e ajustar a RLS.

-- Vamos criar uma view que mascara o CPF para quem não é admin
CREATE OR REPLACE VIEW public.donations_safe AS
SELECT 
  id, tenant_id, campaign_id, nome_doador, 
  CASE 
    WHEN (public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'admin_gabinete'::app_role)) 
    THEN cpf_cnpj 
    ELSE NULL 
  END as cpf_cnpj,
  tipo, valor, data, forma_pagamento, comprovante_url, created_at, updated_at
FROM public.donations
WHERE (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));

ALTER VIEW public.donations_safe OWNER TO postgres;
GRANT SELECT ON public.donations_safe TO authenticated;

-- Garantir que a RLS da tabela original esteja correta para o SELECT
-- (A view acima já filtra as linhas, mas a RLS na tabela base é uma camada extra de segurança)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin view donations" ON public.donations;
CREATE POLICY "Admin view donations"
ON public.donations
FOR SELECT
TO authenticated
USING (
  (tenant_id = get_user_tenant_id(auth.uid())) 
  AND (
    has_role(auth.uid(), 'super_admin'::app_role) 
    OR has_role(auth.uid(), 'admin_gabinete'::app_role) 
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);
