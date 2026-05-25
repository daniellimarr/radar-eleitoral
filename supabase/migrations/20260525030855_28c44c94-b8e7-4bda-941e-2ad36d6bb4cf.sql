-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to request geocoding via Edge Function
CREATE OR REPLACE FUNCTION public.request_contact_geocoding()
RETURNS TRIGGER AS $$
BEGIN
  -- Only request if coords are missing and we have some address info
  IF (NEW.latitude IS NULL OR NEW.longitude IS NULL) AND 
     (NEW.cep IS NOT NULL OR NEW.address IS NOT NULL OR NEW.city IS NOT NULL) THEN
    
    PERFORM
      net.http_post(
        url := 'https://wlfjgondrmbklbyuiqnd.supabase.co/functions/v1/geocode-cep',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZmpnb25kcm1ia2xieXVpcW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTUxMzksImV4cCI6MjA4ODA3MTEzOX0.b2PCH6zHcAzQavjtyjsafhRNRqRq4oDOA_bkRm9ndoE'
        ),
        body := jsonb_build_object(
          'id', NEW.id,
          'cep', NEW.cep,
          'address', NEW.address,
          'city', NEW.city,
          'state', NEW.state
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on contacts table
DROP TRIGGER IF EXISTS trigger_geocode_contact ON public.contacts;
CREATE TRIGGER trigger_geocode_contact
AFTER INSERT OR UPDATE OF cep, address, city, state ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.request_contact_geocoding();

-- Geocode existing contacts that have no coordinates
-- This will trigger the request for each contact
UPDATE public.contacts
SET updated_at = now()
WHERE latitude IS NULL OR longitude IS NULL;
