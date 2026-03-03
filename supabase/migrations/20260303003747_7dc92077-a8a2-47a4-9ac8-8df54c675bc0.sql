
-- ========================================
-- CAMPAIGNS table
-- ========================================
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  nome_campanha text NOT NULL,
  cargo text NOT NULL DEFAULT 'vereador',
  cidade text,
  estado text DEFAULT 'SP',
  partido text,
  numero text,
  meta_votos integer DEFAULT 0,
  limite_gastos numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pre_campanha',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view campaigns" ON public.campaigns FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant manage campaigns" ON public.campaigns FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DONATIONS table
-- ========================================
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  campaign_id uuid REFERENCES public.campaigns(id),
  nome_doador text NOT NULL,
  cpf_cnpj text,
  valor numeric NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'PF',
  data date NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento text,
  comprovante_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view donations" ON public.donations FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant manage donations" ON public.donations FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SUPPLIERS table
-- ========================================
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  nome text NOT NULL,
  cpf_cnpj text,
  contato text,
  email text,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view suppliers" ON public.suppliers FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant manage suppliers" ON public.suppliers FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- EXPENSES table
-- ========================================
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  campaign_id uuid REFERENCES public.campaigns(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  descricao text NOT NULL,
  categoria text,
  valor numeric NOT NULL DEFAULT 0,
  data date NOT NULL DEFAULT CURRENT_DATE,
  evento_id uuid REFERENCES public.appointments(id),
  comprovante_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view expenses" ON public.expenses FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant manage expenses" ON public.expenses FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CONTENT_PLANS table (Marketing)
-- ========================================
CREATE TABLE public.content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  campaign_id uuid REFERENCES public.campaigns(id),
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'post',
  plataforma text,
  data_publicacao date,
  status text NOT NULL DEFAULT 'planejado',
  responsavel_id uuid,
  descricao text,
  custo_impulsionamento numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view content_plans" ON public.content_plans FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant manage content_plans" ON public.content_plans FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON public.content_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VOTER_INTERACTIONS table (Histórico de interações)
-- ========================================
CREATE TABLE public.voter_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid,
  tipo text NOT NULL DEFAULT 'visita',
  descricao text,
  data timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voter_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view voter_interactions" ON public.voter_interactions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant manage voter_interactions" ON public.voter_interactions FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));
