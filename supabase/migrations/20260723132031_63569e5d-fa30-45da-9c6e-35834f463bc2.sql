
CREATE OR REPLACE FUNCTION public.request_contact_geocoding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF (NEW.latitude IS NULL OR NEW.longitude IS NULL) AND
     (NEW.cep IS NOT NULL OR NEW.address IS NOT NULL OR NEW.city IS NOT NULL) THEN
    PERFORM
      extensions.http_post(
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
$function$;
