
CREATE POLICY "Tenant update demand docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'demand-documents' AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text);
