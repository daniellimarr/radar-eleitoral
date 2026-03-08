
-- Add asaas_customer_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS asaas_customer_id text;

-- Add asaas fields to subscriptions (some may already exist)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS asaas_customer_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_due_date date;

-- Create payments table for Asaas payment tracking
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  asaas_payment_id text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_date timestamp with time zone,
  due_date date,
  billing_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Super admin can view all payments
CREATE POLICY "Super admin view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Service role manages payments (for webhooks)
CREATE POLICY "Service role manages payments"
ON public.payments
FOR ALL
USING (true)
WITH CHECK (true);
