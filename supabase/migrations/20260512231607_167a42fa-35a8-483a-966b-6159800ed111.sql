
-- Recreate safe views with security_invoker so RLS of caller is enforced (fixes linter)
DROP VIEW IF EXISTS public.profiles_safe;
DROP VIEW IF EXISTS public.subscriptions_safe;
DROP VIEW IF EXISTS public.payments_safe;

-- Grant column-level SELECT on base tables (excludes sensitive Asaas columns)
GRANT SELECT (id, user_id, tenant_id, full_name, avatar_url, phone, status, created_at, updated_at)
  ON public.profiles TO authenticated;

GRANT SELECT (id, tenant_id, user_id, plan_name, status, started_at, expires_at, cancelled_at, next_due_date, created_at, updated_at)
  ON public.subscriptions TO authenticated;

GRANT SELECT (id, tenant_id, user_id, subscription_id, amount, billing_type, due_date, payment_date, status, created_at, updated_at)
  ON public.payments TO authenticated;

-- Recreate views with security_invoker = true (RLS enforced as caller)
CREATE VIEW public.profiles_safe
  WITH (security_invoker = true) AS
  SELECT id, user_id, tenant_id, full_name, avatar_url, phone, status, created_at, updated_at
  FROM public.profiles;

CREATE VIEW public.subscriptions_safe
  WITH (security_invoker = true) AS
  SELECT id, tenant_id, user_id, plan_name, status, started_at, expires_at, cancelled_at, next_due_date, created_at, updated_at
  FROM public.subscriptions;

CREATE VIEW public.payments_safe
  WITH (security_invoker = true) AS
  SELECT id, tenant_id, user_id, subscription_id, amount, billing_type, due_date, payment_date, status, created_at, updated_at
  FROM public.payments;

GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.subscriptions_safe TO authenticated;
GRANT SELECT ON public.payments_safe TO authenticated;
