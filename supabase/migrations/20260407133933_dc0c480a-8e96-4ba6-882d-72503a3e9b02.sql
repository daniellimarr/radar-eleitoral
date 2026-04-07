
-- Enable the vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Store the encryption key in the vault
SELECT vault.create_secret('rdr-eleitoral-lgpd-2026-enc-key', 'encryption_key', 'PGP symmetric encryption key for contact PII');

-- Replace the hardcoded encryption_key function to read from vault
CREATE OR REPLACE FUNCTION public.encryption_key()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'vault'
AS $function$
DECLARE
  _key text;
BEGIN
  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'encryption_key'
  LIMIT 1;
  
  IF _key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  
  RETURN _key;
END;
$function$;
