CREATE OR REPLACE FUNCTION public.encrypt_sensitive(val text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF val IS NULL OR val = '' THEN
    RETURN val;
  END IF;
  RETURN encode(extensions.pgp_sym_encrypt(val, encryption_key()), 'base64');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive(text) FROM authenticated;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive(val text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF val IS NULL OR val = '' THEN
    RETURN val;
  END IF;
  BEGIN
    RETURN extensions.pgp_sym_decrypt(decode(val, 'base64'), encryption_key());
  EXCEPTION WHEN OTHERS THEN
    RETURN val;
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_contact_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    BEGIN
      PERFORM extensions.pgp_sym_decrypt(decode(NEW.cpf, 'base64'), encryption_key());
    EXCEPTION WHEN OTHERS THEN
      NEW.cpf := encrypt_sensitive(NEW.cpf);
    END;
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    BEGIN
      PERFORM extensions.pgp_sym_decrypt(decode(NEW.phone, 'base64'), encryption_key());
    EXCEPTION WHEN OTHERS THEN
      NEW.phone := encrypt_sensitive(NEW.phone);
    END;
  END IF;

  RETURN NEW;
END;
$function$;