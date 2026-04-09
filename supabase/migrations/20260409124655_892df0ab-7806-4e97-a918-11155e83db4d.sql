
-- Create demand_documents table
CREATE TABLE public.demand_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id uuid NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  storage_path text NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant view demand documents"
ON public.demand_documents FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant insert demand documents"
ON public.demand_documents FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant delete demand documents"
ON public.demand_documents FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('demand-documents', 'demand-documents', false);

-- Storage policies
CREATE POLICY "Tenant upload demand docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'demand-documents' AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text);

CREATE POLICY "Tenant view demand docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'demand-documents' AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text);

CREATE POLICY "Tenant delete demand docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'demand-documents' AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text);
