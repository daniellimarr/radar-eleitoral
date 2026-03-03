
-- =============================================
-- FIX: Restrict sensitive data access by role
-- =============================================

-- 1. DONATIONS: Only admin_gabinete, coordenador, super_admin can access
DROP POLICY IF EXISTS "Tenant manage donations" ON public.donations;
DROP POLICY IF EXISTS "Tenant view donations" ON public.donations;

CREATE POLICY "Admin manage donations"
ON public.donations FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

CREATE POLICY "Admin view donations"
ON public.donations FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- 2. EXPENSES: Only admin_gabinete, coordenador, super_admin
DROP POLICY IF EXISTS "Tenant manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Tenant view expenses" ON public.expenses;

CREATE POLICY "Admin manage expenses"
ON public.expenses FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

CREATE POLICY "Admin view expenses"
ON public.expenses FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- 3. SUPPLIERS: Only admin_gabinete, coordenador, super_admin
DROP POLICY IF EXISTS "Tenant manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Tenant view suppliers" ON public.suppliers;

CREATE POLICY "Admin manage suppliers"
ON public.suppliers FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

CREATE POLICY "Admin view suppliers"
ON public.suppliers FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- 4. VEHICLES: Only admin_gabinete, coordenador, super_admin
DROP POLICY IF EXISTS "Tenant manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant view vehicles" ON public.vehicles;

CREATE POLICY "Admin manage vehicles"
ON public.vehicles FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

CREATE POLICY "Admin view vehicles"
ON public.vehicles FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

-- 5. PROFILES: Restrict to own profile + admins only (not all tenant members)
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admin_gabinete'::app_role)
);

-- 6. CAMPAIGNS: Restrict strategic data (only coordenador+ can see)
DROP POLICY IF EXISTS "Tenant manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Tenant view campaigns" ON public.campaigns;

CREATE POLICY "Admin manage campaigns"
ON public.campaigns FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin_gabinete'::app_role)
    OR has_role(auth.uid(), 'coordenador'::app_role)
  )
);

CREATE POLICY "Tenant view campaigns"
ON public.campaigns FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
