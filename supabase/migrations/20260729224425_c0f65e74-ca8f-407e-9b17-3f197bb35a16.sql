ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS cpf_hash text;

CREATE OR REPLACE FUNCTION public.cpf_fingerprint(val text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN val IS NULL OR regexp_replace(val, '\D', '', 'g') = '' THEN NULL
    ELSE encode(extensions.digest(regexp_replace(val, '\D', '', 'g'), 'sha256'), 'hex')
  END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_contact_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _raw_cpf text;
BEGIN
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    BEGIN
      -- Se decriptar, o valor já está criptografado
      _raw_cpf := extensions.pgp_sym_decrypt(decode(NEW.cpf, 'base64'), encryption_key());
    EXCEPTION WHEN OTHERS THEN
      _raw_cpf := NEW.cpf;
      NEW.cpf := encrypt_sensitive(NEW.cpf);
    END;
    NEW.cpf_hash := public.cpf_fingerprint(_raw_cpf);
  ELSE
    NEW.cpf_hash := NULL;
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
$$;

-- Backfill dos contatos existentes
UPDATE public.contacts
   SET cpf_hash = public.cpf_fingerprint(public.decrypt_sensitive(cpf))
 WHERE cpf IS NOT NULL AND cpf <> '' AND cpf_hash IS NULL;

-- Evita falha do índice único por duplicidades históricas: mantém o mais antigo
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY tenant_id, cpf_hash ORDER BY created_at) rn
  FROM public.contacts
  WHERE cpf_hash IS NOT NULL AND deleted_at IS NULL
)
UPDATE public.contacts c
   SET cpf_hash = NULL
  FROM ranked r
 WHERE c.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS contacts_tenant_cpf_unique
  ON public.contacts (tenant_id, cpf_hash)
  WHERE cpf_hash IS NOT NULL AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.check_contact_cpf_exists(p_tenant_id uuid, p_cpf text, p_exclude_id uuid DEFAULT NULL)
RETURNS TABLE(exists_contact boolean, contact_id uuid, contact_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT true, c.id, c.name
  FROM public.contacts c
  WHERE c.tenant_id = p_tenant_id
    AND c.deleted_at IS NULL
    AND c.cpf_hash IS NOT NULL
    AND c.cpf_hash = public.cpf_fingerprint(p_cpf)
    AND (p_exclude_id IS NULL OR c.id <> p_exclude_id)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.check_contact_cpf_exists(uuid, text, uuid) TO authenticated, anon;