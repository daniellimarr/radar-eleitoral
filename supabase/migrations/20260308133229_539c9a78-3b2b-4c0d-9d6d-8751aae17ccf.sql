-- Fix storage tenant isolation for campaign-files bucket
DROP POLICY IF EXISTS "Authenticated read campaign files" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload campaign files" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete campaign files" ON storage.objects;

-- Tenant-scoped read: users can only read files in their tenant folder
CREATE POLICY "Tenant read campaign files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'campaign-files'
    AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
  );

-- Tenant-scoped upload: only admins/coordinators can upload to their tenant folder
CREATE POLICY "Tenant upload campaign files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-files'
    AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
    AND (
      has_role(auth.uid(), 'super_admin'::app_role)
      OR has_role(auth.uid(), 'admin_gabinete'::app_role)
      OR has_role(auth.uid(), 'coordenador'::app_role)
    )
  );

-- Tenant-scoped delete: only admins/coordinators can delete from their tenant folder
CREATE POLICY "Tenant delete campaign files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'campaign-files'
    AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text
    AND (
      has_role(auth.uid(), 'super_admin'::app_role)
      OR has_role(auth.uid(), 'admin_gabinete'::app_role)
      OR has_role(auth.uid(), 'coordenador'::app_role)
    )
  );