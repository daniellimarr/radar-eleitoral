-- First, check if we can create the secret
DO $$
DECLARE
  new_key text := extensions.gen_random_uuid()::text || extensions.gen_random_uuid()::text;
BEGIN
  -- Use the vault.create_secret function
  PERFORM vault.create_secret(new_key, 'encryption_key_v3', 'Final rotated PGP symmetric encryption key for contact PII');
EXCEPTION WHEN OTHERS THEN
  -- If it already exists or other error, we ignore for now as we might be re-running
  NULL;
END $$;

-- Temporary function for re-encryption
CREATE OR REPLACE FUNCTION public.reencrypt_with_v3_key(old_val text)
RETURNS text LANGUAGE plpgsql AS $func$
DECLARE
  decrypted text;
  new_key_secret text;
BEGIN
  IF old_val IS NULL OR old_val = '' THEN RETURN old_val; END IF;
  
  -- Try decrypting with current encryption_key()
  BEGIN
    decrypted := extensions.pgp_sym_decrypt(decode(old_val, 'base64'), public.encryption_key());
  EXCEPTION WHEN OTHERS THEN
    RETURN old_val;
  END;

  -- Get new key from vault
  SELECT decrypted_secret INTO new_key_secret FROM vault.decrypted_secrets WHERE name = 'encryption_key_v3' LIMIT 1;
  
  IF new_key_secret IS NULL THEN RETURN old_val; END IF;
  
  RETURN encode(extensions.pgp_sym_encrypt(decrypted, new_key_secret), 'base64');
END;
$func$;

-- Re-encrypt data
UPDATE public.contacts SET 
  cpf = reencrypt_with_v3_key(cpf),
  phone = reencrypt_with_v3_key(phone)
WHERE (cpf IS NOT NULL AND cpf != '') OR (phone IS NOT NULL AND phone != '');

-- Drop temporary function
DROP FUNCTION public.reencrypt_with_v3_key(text);

-- Update the encryption_key function to use the new v3 secret
CREATE OR REPLACE FUNCTION public.encryption_key()
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
DECLARE
  _key text;
BEGIN
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'encryption_key_v3' LIMIT 1;
  IF _key IS NULL THEN
    -- Fallback to old keys during transition if needed, but here we want strictness
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  RETURN _key;
END;
$function$;
