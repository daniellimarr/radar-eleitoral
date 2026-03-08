
-- Fix overly permissive RLS policy on payments
DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;

-- Insert policy for webhook (service role bypasses RLS anyway)
CREATE POLICY "Authenticated insert payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
