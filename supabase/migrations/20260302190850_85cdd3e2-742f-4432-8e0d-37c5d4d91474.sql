
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin_gabinete', 'coordenador', 'assessor', 'operador');

-- Enum for tenant status
CREATE TYPE public.tenant_status AS ENUM ('ativo', 'suspenso', 'cancelado');

-- Enum for demand status
CREATE TYPE public.demand_status AS ENUM ('aberta', 'em_andamento', 'concluida', 'cancelada');

-- Enum for engagement level
CREATE TYPE public.engagement_level AS ENUM ('nao_trabalhado', 'em_prospeccao', 'conquistado', 'criando_envolvimento', 'falta_trabalhar', 'envolvimento_perdido');

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  contact_limit INTEGER NOT NULL DEFAULT 1000,
  user_limit INTEGER NOT NULL DEFAULT 5,
  has_premium_modules BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT, -- CNPJ or CPF
  status tenant_status NOT NULL DEFAULT 'ativo',
  plan_id UUID REFERENCES public.plans(id),
  contact_limit INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'operador',
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, tenant_id)
);

-- Contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  cpf TEXT,
  gender TEXT,
  birth_date DATE,
  phone TEXT,
  has_whatsapp BOOLEAN DEFAULT false,
  email TEXT,
  cep TEXT,
  address TEXT,
  address_number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT DEFAULT 'SP',
  voting_zone TEXT,
  voting_section TEXT,
  voting_location TEXT,
  engagement engagement_level DEFAULT 'nao_trabalhado',
  is_leader BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  observations TEXT,
  category TEXT,
  subcategory TEXT,
  registered_by UUID REFERENCES auth.users(id),
  leader_id UUID, -- self-reference for leader association
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Leaders table
CREATE TABLE public.leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  engagement_score INTEGER DEFAULT 0,
  total_contacts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Demands table
CREATE TABLE public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status demand_status NOT NULL DEFAULT 'aberta',
  responsible_id UUID REFERENCES auth.users(id),
  priority TEXT DEFAULT 'normal',
  deadline DATE,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicles table (Cadastro de carro)
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  plate TEXT NOT NULL,
  model TEXT,
  brand TEXT,
  year INTEGER,
  color TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  status TEXT DEFAULT 'disponivel',
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign materials table
CREATE TABLE public.campaign_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- banner, panfleto, adesivo, etc
  quantity INTEGER DEFAULT 0,
  quantity_distributed INTEGER DEFAULT 0,
  storage_location TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visit requests table (solicitações de visitas/reuniões)
CREATE TABLE public.visit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requested_date TIMESTAMPTZ,
  location TEXT,
  chairs_needed INTEGER DEFAULT 0,
  needs_political_material BOOLEAN DEFAULT false,
  needs_banners BOOLEAN DEFAULT false,
  needs_sound BOOLEAN DEFAULT false,
  material_observations TEXT,
  status TEXT DEFAULT 'pendente',
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registration links table (link público de cadastro)
CREATE TABLE public.registration_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  coordinator_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_links ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_demands_updated_at BEFORE UPDATE ON public.demands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_materials_updated_at BEFORE UPDATE ON public.campaign_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visit_requests_updated_at BEFORE UPDATE ON public.visit_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leaders_updated_at BEFORE UPDATE ON public.leaders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Plans: readable by all authenticated
CREATE POLICY "Plans are viewable by authenticated" ON public.plans FOR SELECT TO authenticated USING (true);

-- Tenants: users see their own tenant, super_admin sees all
CREATE POLICY "Users view own tenant" ON public.tenants FOR SELECT TO authenticated
  USING (id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages tenants" ON public.tenants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User roles
CREATE POLICY "View roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_gabinete'));
CREATE POLICY "Admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_gabinete'));

-- Contacts: tenant isolation
CREATE POLICY "Tenant users view contacts" ON public.contacts FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant users manage contacts" ON public.contacts FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant users update contacts" ON public.contacts FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant users delete contacts" ON public.contacts FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
-- Public registration (anon)
CREATE POLICY "Public registration insert" ON public.contacts FOR INSERT TO anon
  WITH CHECK (true);

-- Leaders
CREATE POLICY "Tenant view leaders" ON public.leaders FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant manage leaders" ON public.leaders FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Demands
CREATE POLICY "Tenant view demands" ON public.demands FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant manage demands" ON public.demands FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Appointments
CREATE POLICY "Tenant view appointments" ON public.appointments FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant manage appointments" ON public.appointments FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Vehicles
CREATE POLICY "Tenant view vehicles" ON public.vehicles FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant manage vehicles" ON public.vehicles FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Campaign materials
CREATE POLICY "Tenant view materials" ON public.campaign_materials FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant manage materials" ON public.campaign_materials FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Visit requests
CREATE POLICY "Tenant view visit requests" ON public.visit_requests FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant manage visit requests" ON public.visit_requests FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Audit logs
CREATE POLICY "View audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Insert audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Registration links
CREATE POLICY "Tenant view links" ON public.registration_links FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Tenant manage links" ON public.registration_links FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
-- Public can read active links
CREATE POLICY "Public view active links" ON public.registration_links FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Indexes for performance
CREATE INDEX idx_contacts_tenant ON public.contacts(tenant_id);
CREATE INDEX idx_contacts_engagement ON public.contacts(tenant_id, engagement);
CREATE INDEX idx_contacts_city ON public.contacts(tenant_id, city);
CREATE INDEX idx_contacts_birth_date ON public.contacts(tenant_id, birth_date);
CREATE INDEX idx_demands_tenant_status ON public.demands(tenant_id, status);
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_registration_links_slug ON public.registration_links(slug);
