CREATE TABLE public.pending_signups (
  asaas_subscription_id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  cpf text NOT NULL,
  phone text,
  plan_key text NOT NULL,
  asaas_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.pending_signups TO service_role;

ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (via edge functions) can read/write.

CREATE INDEX idx_pending_signups_cpf_plan ON public.pending_signups(cpf, plan_key, created_at DESC);