
-- Fix: restrict public contact registration to require a valid registration link tenant_id
DROP POLICY "Public registration insert" ON public.contacts;
CREATE POLICY "Public registration via link" ON public.contacts FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.registration_links
      WHERE tenant_id = contacts.tenant_id
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Fix: restrict audit log insertion to authenticated users with matching tenant
DROP POLICY "Insert audit logs" ON public.audit_logs;
CREATE POLICY "Insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id(auth.uid()))
  );
