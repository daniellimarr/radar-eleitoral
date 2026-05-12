-- ============================================
-- 1. Encryption key rotation
-- ============================================

-- Create new random key in vault
SELECT vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'base64'),
  'encryption_key_rotated',
  'Rotated PGP symmetric encryption key for contact PII'
);

-- Temp function with old hardcoded key
CREATE OR REPLACE FUNCTION public.encryption_key_old()
RETURNS text LANGUAGE sql IMMUTABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT 'rdr-eleitoral-lgpd-2026-enc-key'::text
$$;

-- Temp re-encryption function
CREATE OR REPLACE FUNCTION public.reencrypt_with_new_key(old_val text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
SET search_path = public, vault AS $$
DECLARE
  decrypted text;
  new_key text;
BEGIN
  IF old_val IS NULL OR old_val = '' THEN RETURN old_val; END IF;
  BEGIN
    decrypted := pgp_sym_decrypt(decode(old_val, 'base64'), encryption_key_old());
  EXCEPTION WHEN OTHERS THEN RETURN old_val; END;
  SELECT decrypted_secret INTO new_key FROM vault.decrypted_secrets WHERE name = 'encryption_key_rotated' LIMIT 1;
  IF new_key IS NULL THEN RAISE EXCEPTION 'New encryption key not found in vault'; END IF;
  RETURN encode(pgp_sym_encrypt(decrypted, new_key), 'base64');
END;
$$;

-- Re-encrypt all contacts
UPDATE public.contacts SET cpf = reencrypt_with_new_key(cpf) WHERE cpf IS NOT NULL AND cpf != '';
UPDATE public.contacts SET phone = reencrypt_with_new_key(phone) WHERE phone IS NOT NULL AND phone != '';

-- Update encryption_key() to use rotated vault secret
CREATE OR REPLACE FUNCTION public.encryption_key()
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
DECLARE _key text;
BEGIN
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'encryption_key_rotated' LIMIT 1;
  IF _key IS NULL THEN RAISE EXCEPTION 'Encryption key not found in vault'; END IF;
  RETURN _key;
END;
$function$;

-- Clean up temp functions
DROP FUNCTION IF EXISTS public.encryption_key_old();
DROP FUNCTION IF EXISTS public.reencrypt_with_new_key(text);

-- Remove old vault secret
DELETE FROM vault.secrets WHERE name = 'encryption_key';

-- ============================================
-- 2. Safe views for Asaas ID protection
-- ============================================

CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = false) AS
SELECT id, user_id, tenant_id, full_name, avatar_url, phone, status, created_at, updated_at
FROM public.profiles
WHERE user_id = auth.uid()
   OR tenant_id = public.get_user_tenant_id(auth.uid())
   OR public.has_role(auth.uid(), 'super_admin')
   OR public.has_role(auth.uid(), 'admin_gabinete');

CREATE OR REPLACE VIEW public.subscriptions_safe
WITH (security_invoker = false) AS
SELECT id, tenant_id, user_id, plan_name, status, started_at, expires_at, cancelled_at, next_due_date, created_at, updated_at
FROM public.subscriptions
WHERE tenant_id = public.get_user_tenant_id(auth.uid())
   OR public.has_role(auth.uid(), 'super_admin');

CREATE OR REPLACE VIEW public.payments_safe
WITH (security_invoker = false) AS
SELECT id, tenant_id, user_id, subscription_id, amount, billing_type, due_date, payment_date, status, created_at, updated_at
FROM public.payments
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'super_admin');

-- Revoke direct SELECT on sensitive tables
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.subscriptions FROM authenticated;
REVOKE SELECT ON public.subscriptions FROM anon;
REVOKE SELECT ON public.payments FROM authenticated;
REVOKE SELECT ON public.payments FROM anon;

-- Grant SELECT on safe views
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;
GRANT SELECT ON public.subscriptions_safe TO authenticated;
GRANT SELECT ON public.subscriptions_safe TO anon;
GRANT SELECT ON public.payments_safe TO authenticated;
GRANT SELECT ON public.payments_safe TO anon;

-- ============================================
-- 3. Realtime messages RLS policies
-- ============================================

CREATE OR REPLACE FUNCTION public.safe_uuid(val text)
RETURNS uuid LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN RETURN val::uuid; EXCEPTION WHEN invalid_text_representation THEN RETURN NULL; END;
$$;

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow notifications channel" ON realtime.messages
FOR SELECT TO authenticated USING (topic = 'notifications-realtime');

CREATE POLICY "Allow presence chat for tenant members" ON realtime.messages
FOR SELECT TO authenticated USING (
  topic LIKE 'presence-chat-%'
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles
    WHERE tenant_id = public.safe_uuid(substring(topic from 15))
  )
);

CREATE POLICY "Allow chat for participants" ON realtime.messages
FOR SELECT TO authenticated USING (
  topic LIKE 'chat-%'
  AND auth.uid() IN (
    SELECT user_id FROM public.chat_participants
    WHERE conversation_id = public.safe_uuid(substring(topic from 6))
  )
);