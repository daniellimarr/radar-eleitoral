
-- Allow all authenticated users to view notifications for their tenant
DROP POLICY IF EXISTS "Admin/coord view notifications" ON public.notifications;
CREATE POLICY "Tenant view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Allow all authenticated users to update notifications (mark as read)
DROP POLICY IF EXISTS "Admin/coord update notifications" ON public.notifications;
CREATE POLICY "Tenant update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Allow super_admin to view all subscriptions
DROP POLICY IF EXISTS "Super admin view all subscriptions" ON public.subscriptions;
CREATE POLICY "Super admin view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
