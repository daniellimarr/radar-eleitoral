
-- 1. Adicionar coluna email em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Trigger para sincronizar email do auth.users para public.profiles
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_profile_email ON auth.users;
CREATE TRIGGER tr_sync_profile_email
AFTER UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- 3. Atualizar handle_new_user para incluir o email no insert inicial
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tenant_id uuid;
  _user_name text;
BEGIN
  _user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- Create tenant with 'suspenso' status
  INSERT INTO public.tenants (name, status, contact_limit)
  VALUES (_user_name, 'suspenso', 5000)
  RETURNING id INTO _tenant_id;

  INSERT INTO public.profiles (user_id, full_name, email, status, tenant_id)
  VALUES (NEW.id, _user_name, NEW.email, 'approved', _tenant_id);

  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'admin_gabinete', _tenant_id);

  RETURN NEW;
END;
$function$;

-- 4. Preencher emails existentes
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- 5. Corrigir RLS de donations para super_admin
DROP POLICY IF EXISTS "Admin view donations" ON public.donations;
CREATE POLICY "Admin view donations"
ON public.donations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR (
    (tenant_id = get_user_tenant_id(auth.uid())) 
    AND (
      has_role(auth.uid(), 'admin_gabinete'::app_role) 
      OR has_role(auth.uid(), 'coordenador'::app_role)
    )
  )
);

-- 6. Corrigir RLS de profiles para permitir ver usuários pendentes (tenant_id IS NULL)
DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
CREATE POLICY "Admin view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR (
    (has_role(auth.uid(), 'admin_gabinete'::app_role) OR has_role(auth.uid(), 'coordenador'::app_role)) 
    AND (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL)
  )
);

-- 7. Simplificar view donations_safe (removendo o WHERE redundante pois a tabela tem RLS e a view é security_invoker)
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

-- Atualizar profiles_safe para garantir que email apareça (se não estiver usando SELECT *)
-- Mas como estava usando SELECT *, vamos apenas recriar para garantir.
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe 
WITH (security_invoker = true)
AS
SELECT 
  id, user_id, tenant_id, full_name, email, avatar_url, phone, status, created_at, updated_at
FROM public.profiles;
