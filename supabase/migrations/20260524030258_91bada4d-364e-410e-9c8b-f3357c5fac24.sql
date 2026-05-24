-- Drop existing RLS policies for contacts
DROP POLICY IF EXISTS "Anon insert contact via registration link" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Tenant users delete contacts" ON public.contacts;

-- Create simplified policies for contacts
CREATE POLICY "Authenticated users can view contacts" 
ON public.contacts 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage contacts" 
ON public.contacts 
FOR ALL 
TO authenticated 
WITH CHECK (true);

-- Allow anonymous insertion for registration links (keeping it flexible)
CREATE POLICY "Enable insertion for anonymous users via registration"
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (true);
