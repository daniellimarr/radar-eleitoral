-- Allow anonymous users to view active registration links so the contacts RLS check can verify them
CREATE POLICY "Allow anonymous to view active registration links" 
ON public.registration_links 
FOR SELECT 
TO anon 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Update the contacts INSERT policy for anonymous users to be more permissive
-- This avoids "new row violates row-level security policy" when users select different engagement levels
DROP POLICY "Public registration via link" ON public.contacts;

CREATE POLICY "Public registration via link" 
ON public.contacts 
FOR INSERT 
TO anon 
WITH CHECK (
  (EXISTS (
    SELECT 1 
    FROM registration_links rl 
    WHERE rl.tenant_id = contacts.tenant_id 
      AND rl.is_active = true 
      AND (rl.expires_at IS NULL OR rl.expires_at > now())
  )) 
  AND (registered_by IS NULL) 
  AND (category IS NULL) 
  AND (subcategory IS NULL) 
  AND (deleted_at IS NULL)
  -- Removed strict checks on engagement and is_leader to allow form flexibility
);
