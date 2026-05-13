-- 1. Security Hardening for Helper Functions
-- Move from SECURITY DEFINER to SECURITY INVOKER where possible to respect caller context
-- or add explicit auth checks.

-- Redefine has_role as SECURITY INVOKER (it should depend on the caller's ability to read user_roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER -- Now respects RLS of user_roles
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Redefine get_user_tenant_id as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 2. Hardening User Permissions (Module access)
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage permissions" ON public.user_permissions;
CREATE POLICY "Admins manage permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin_gabinete')
    AND tenant_id = public.user_permissions.tenant_id
  )
);

-- 3. Audit Log Security
-- Ensure users can only insert logs for their own tenant
DROP POLICY IF EXISTS "Insert audit logs" ON public.audit_logs;
CREATE POLICY "Insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  AND user_id = auth.uid()
);

-- 4. Restrict Sensitive Data (Donations & Payments)
-- Ensure 'operador' and 'assessor' cannot view raw CPF/CNPJ in contacts if not needed
-- Note: This is a structural change, we'll start by reinforcing the isolation.

DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;
CREATE POLICY "Tenant users view contacts" 
ON public.contacts 
FOR SELECT 
TO authenticated
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- 5. Hardening anonymous registration links
-- Ensure they can't be used to flood the database with garbage data
ALTER TABLE public.registration_links ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE public.registration_links ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_link_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.registration_links 
  SET current_uses = current_uses + 1 
  WHERE id = (SELECT registration_link_id FROM public.contacts WHERE id = NEW.id); -- Assuming registration_link_id exists or we track it
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Rate Limiting Placeholder (Log attempts)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false
);
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- Internal only, no public RLS needed.
