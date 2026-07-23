
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.expire_overdue_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
     SET status = 'expired', updated_at = now()
   WHERE status = 'active'
     AND expires_at IS NOT NULL
     AND expires_at < now();

  UPDATE public.tenants t
     SET status = 'suspenso', updated_at = now()
   WHERE t.status = 'ativo'
     AND EXISTS (
       SELECT 1 FROM public.subscriptions s
        WHERE s.tenant_id = t.id
          AND s.status = 'expired'
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.subscriptions s2
        WHERE s2.tenant_id = t.id
          AND s2.status = 'active'
          AND (s2.expires_at IS NULL OR s2.expires_at > now())
     );
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('expire-overdue-subscriptions');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-overdue-subscriptions',
  '0 3 * * *',
  $$SELECT public.expire_overdue_subscriptions();$$
);
