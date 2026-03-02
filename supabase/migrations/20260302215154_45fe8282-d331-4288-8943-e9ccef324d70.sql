
-- Add latitude and longitude columns to contacts for geocoding
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create index for geo queries
CREATE INDEX IF NOT EXISTS idx_contacts_geo ON public.contacts (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
