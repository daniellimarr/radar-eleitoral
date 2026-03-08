
-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Private encryption key function (SECURITY DEFINER, not callable by users)
CREATE OR REPLACE FUNCTION public.encryption_key()
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'rdr-eleitoral-lgpd-2026-enc-key'::text
$$;

REVOKE EXECUTE ON FUNCTION public.encryption_key() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encryption_key() FROM anon;
REVOKE EXECUTE ON FUNCTION public.encryption_key() FROM authenticated;

-- Encrypt function (only callable by triggers/SECURITY DEFINER functions)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(val text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF val IS NULL OR val = '' THEN
    RETURN val;
  END IF;
  RETURN encode(pgp_sym_encrypt(val, encryption_key()), 'base64');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM authenticated;

-- Decrypt function (callable by authenticated for views)
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(val text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF val IS NULL OR val = '' THEN
    RETURN val;
  END IF;
  BEGIN
    RETURN pgp_sym_decrypt(decode(val, 'base64'), encryption_key());
  EXCEPTION WHEN OTHERS THEN
    RETURN val;
  END;
END;
$$;

-- Trigger to auto-encrypt cpf and phone on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.encrypt_contact_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    BEGIN
      PERFORM pgp_sym_decrypt(decode(NEW.cpf, 'base64'), encryption_key());
    EXCEPTION WHEN OTHERS THEN
      NEW.cpf := encrypt_sensitive(NEW.cpf);
    END;
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    BEGIN
      PERFORM pgp_sym_decrypt(decode(NEW.phone, 'base64'), encryption_key());
    EXCEPTION WHEN OTHERS THEN
      NEW.phone := encrypt_sensitive(NEW.phone);
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_contacts_before_write
BEFORE INSERT OR UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_contact_fields();

-- Encrypt existing CPF data
UPDATE public.contacts SET cpf = encrypt_sensitive(cpf)
WHERE cpf IS NOT NULL AND cpf != '';

-- Encrypt existing phone data
UPDATE public.contacts SET phone = encrypt_sensitive(phone)
WHERE phone IS NOT NULL AND phone != '';

-- Create decrypted view with security_invoker so RLS applies
CREATE OR REPLACE VIEW public.contacts_decrypted WITH (security_invoker = true) AS
SELECT
  id, tenant_id, name, nickname,
  decrypt_sensitive(cpf) as cpf,
  gender, birth_date,
  decrypt_sensitive(phone) as phone,
  has_whatsapp, email, cep, address, address_number,
  neighborhood, city, state,
  voting_zone, voting_section, voting_location,
  observations, engagement, is_leader, leader_id,
  registered_by, latitude, longitude,
  category, subcategory, tags,
  created_at, updated_at, deleted_at
FROM public.contacts;
