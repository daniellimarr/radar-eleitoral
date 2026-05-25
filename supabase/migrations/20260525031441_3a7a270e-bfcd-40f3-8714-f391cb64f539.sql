-- Update contacts to trigger geocoding one more time, ensuring we target those with address info
UPDATE public.contacts
SET address = address
WHERE latitude IS NULL AND (cep IS NOT NULL OR address IS NOT NULL);
