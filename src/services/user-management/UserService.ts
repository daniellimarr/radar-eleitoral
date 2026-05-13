import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export class UserService {
  static async fetchTenantProfiles(tenantId: string) {
    return supabase
      .from("profiles_safe")
      .select("user_id, full_name, email, status")
      .eq("tenant_id", tenantId);
  }

  static async fetchPendingProfiles() {
    return supabase
      .from("profiles_safe")
      .select("user_id, full_name, email, status")
      .is("tenant_id", null)
      .eq("status", "pending");
  }

  static async fetchUsersRoles(userIds: string[]) {
    return supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);
  }

  static async fetchUsersPermissions(userIds: string[], tenantId: string) {
    return supabase
      .from("user_permissions")
      .select("user_id, module")
      .in("user_id", userIds)
      .eq("tenant_id", tenantId);
  }

  static async updateProfileStatus(userId: string, updates: any) {
    return supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
  }

  static async clearPermissions(userId: string, tenantId: string) {
    return supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);
  }

  static async insertPermissions(rows: any[]) {
    return supabase
      .from("user_permissions")
      .insert(rows);
  }

  static async getRole(userId: string) {
    return supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
  }

  static async insertRole(userId: string, role: AppRole, tenantId: string) {
    return supabase.from("user_roles").insert({
      user_id: userId,
      role,
      tenant_id: tenantId,
    });
  }
}
