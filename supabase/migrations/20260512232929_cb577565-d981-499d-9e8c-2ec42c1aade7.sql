-- Remove direct SELECT access for authenticated users to the whole table
REVOKE SELECT ON public.payments FROM authenticated;

-- Grant column-level SELECT access for all columns EXCEPT asaas_payment_id
GRANT SELECT (
  id,
  tenant_id,
  user_id,
  subscription_id,
  amount,
  status,
  payment_date,
  due_date,
  billing_type,
  created_at,
  updated_at
) ON public.payments TO authenticated;

-- Ensure super_admin can still see everything (they usually bypass RLS, but explicit GRANT is safer)
GRANT SELECT ON public.payments TO service_role;

-- The existing policies remain:
-- 'Users view own payments' policy logic (tenant_id = get_user_tenant_id(auth.uid())) 
-- will now filter rows, and the column-level GRANTs will filter columns.
