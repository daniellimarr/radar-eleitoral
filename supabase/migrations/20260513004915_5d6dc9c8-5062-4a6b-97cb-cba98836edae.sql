-- Function to handle auto-encryption for donations
CREATE OR REPLACE FUNCTION public.encrypt_donation_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt cpf_cnpj if it's provided and not already encrypted
  IF NEW.cpf_cnpj IS NOT NULL AND NEW.cpf_cnpj != '' THEN
    BEGIN
      -- Check if already encrypted by attempting decryption
      PERFORM extensions.pgp_sym_decrypt(decode(NEW.cpf_cnpj, 'base64'), public.encryption_key());
    EXCEPTION WHEN OTHERS THEN
      -- If decryption fails, it's raw text, so encrypt it
      NEW.cpf_cnpj := public.encrypt_sensitive(NEW.cpf_cnpj);
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for donations
DROP TRIGGER IF EXISTS tr_encrypt_donations ON public.donations;
CREATE TRIGGER tr_encrypt_donations
BEFORE INSERT OR UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.encrypt_donation_fields();

-- Create decrypted view for donations
CREATE OR REPLACE VIEW public.donations_decrypted WITH (security_invoker = true) AS
SELECT 
  id,
  tenant_id,
  campaign_id,
  valor,
  data,
  created_at,
  updated_at,
  comprovante_url,
  nome_doador,
  public.decrypt_sensitive(cpf_cnpj) as cpf_cnpj,
  forma_pagamento,
  tipo
FROM public.donations;

-- Re-encrypt existing donations
UPDATE public.donations 
SET cpf_cnpj = public.encrypt_sensitive(cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '' 
AND (length(cpf_cnpj) < 20 OR cpf_cnpj NOT LIKE 'jA0E%'); -- Basic check to avoid double encryption
