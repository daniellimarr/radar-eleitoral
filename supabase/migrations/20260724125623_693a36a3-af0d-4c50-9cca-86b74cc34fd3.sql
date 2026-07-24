CREATE OR REPLACE FUNCTION public.normalize_contact_empty_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.birth_date::text = '' THEN
    NEW.birth_date := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_contact_empty_dates_trigger ON public.contacts;
CREATE TRIGGER normalize_contact_empty_dates_trigger
BEFORE INSERT OR UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.normalize_contact_empty_dates();