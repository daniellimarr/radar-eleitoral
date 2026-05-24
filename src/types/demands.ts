import { Database } from "@/integrations/supabase/types";

export type DemandStatus = Database["public"]["Enums"]["demand_status"];

export interface Demand {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: DemandStatus;
  priority: string;
  responsible_id: string | null;
  contact_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  contacts?: {
    name: string;
    leader_id: string | null;
  } | null;
}

export interface DemandDocument {
  id: string;
  demand_id: string;
  tenant_id: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}
