-- Allow super_admin to manage plans (INSERT, UPDATE, DELETE)
CREATE POLICY "Super admin manage plans"
ON public.plans
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));