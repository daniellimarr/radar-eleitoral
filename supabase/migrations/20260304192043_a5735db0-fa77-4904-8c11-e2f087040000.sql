
-- Allow admins to update profiles (for approval workflow)
CREATE POLICY "Admin update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin_gabinete'::app_role) OR
  has_role(auth.uid(), 'coordenador'::app_role)
);

-- Allow admins to view all profiles (including pending ones without tenant)
CREATE POLICY "Admin view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin_gabinete'::app_role) OR
  has_role(auth.uid(), 'coordenador'::app_role)
);
