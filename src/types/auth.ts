export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  tenant_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  tenant_id: string | null;
}

export interface UserPermission {
  id: string;
  user_id: string;
  module: string;
  tenant_id: string;
}
