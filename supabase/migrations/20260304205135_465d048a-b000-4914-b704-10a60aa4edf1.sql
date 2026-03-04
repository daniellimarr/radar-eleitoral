
-- Create table for campaign file downloads
CREATE TABLE public.campaign_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'card',
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_files ENABLE ROW LEVEL SECURITY;

-- All tenant users can view files
CREATE POLICY "Tenant view campaign_files" ON public.campaign_files
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Only admin/coordinator can manage files
CREATE POLICY "Admin manage campaign_files" ON public.campaign_files
  FOR ALL TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND (
      has_role(auth.uid(), 'super_admin'::app_role) OR 
      has_role(auth.uid(), 'admin_gabinete'::app_role) OR 
      has_role(auth.uid(), 'coordenador'::app_role)
    )
  );

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-files', 'campaign-files', false);

-- Storage RLS: tenant users can read
CREATE POLICY "Authenticated read campaign files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'campaign-files');

-- Storage RLS: admins can upload
CREATE POLICY "Admin upload campaign files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'campaign-files');

-- Storage RLS: admins can delete  
CREATE POLICY "Admin delete campaign files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'campaign-files');
