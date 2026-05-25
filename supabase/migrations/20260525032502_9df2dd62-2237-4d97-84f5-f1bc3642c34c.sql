-- Fix RLS for contacts table (anonymous insert)
DROP POLICY IF EXISTS "Public registration via link" ON public.contacts;

CREATE POLICY "Public registration via link" 
ON public.contacts 
FOR INSERT 
TO anon 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registration_links rl 
    WHERE rl.tenant_id = contacts.tenant_id 
    AND rl.is_active = true 
    AND (rl.expires_at IS NULL OR rl.expires_at > now())
  )
);

-- Ensure anon can also view these links to satisfy the EXISTS check
-- (This already exists but let's make sure it's correct)
DROP POLICY IF EXISTS "Allow anonymous to view active registration links" ON public.registration_links;
CREATE POLICY "Allow anonymous to view active registration links" 
ON public.registration_links 
FOR SELECT 
TO anon 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Trigger to automatically create a leader record when a contact is created as a leader
CREATE OR REPLACE FUNCTION public.handle_new_leader_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_leader = true THEN
    INSERT INTO public.leaders (contact_id, tenant_id)
    VALUES (NEW.id, NEW.tenant_id)
    ON CONFLICT (contact_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_leader_contact ON public.contacts;
CREATE TRIGGER on_new_leader_contact
AFTER INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_leader_contact();
