-- Drop views that depend on the columns first
DROP VIEW IF EXISTS public.profiles_safe;
DROP VIEW IF EXISTS public.subscriptions_safe;

-- Remove Asaas columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS asaas_customer_id;

-- Remove Asaas columns from subscriptions
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS asaas_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS asaas_customer_id;

-- Remove Asaas columns from payments
ALTER TABLE public.payments DROP COLUMN IF EXISTS asaas_payment_id;

-- Recreate views without Asaas fields
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT id, user_id, tenant_id, full_name, created_at, updated_at, avatar_url, email, phone, status
FROM public.profiles;

CREATE OR REPLACE VIEW public.subscriptions_safe AS
SELECT id, tenant_id, user_id, plan_name, status, started_at, expires_at, cancelled_at, next_due_date, created_at, updated_at
FROM public.subscriptions;

-- Fix permissions for the new views
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.subscriptions_safe TO authenticated;
GRANT SELECT ON public.subscriptions_safe TO anon;
