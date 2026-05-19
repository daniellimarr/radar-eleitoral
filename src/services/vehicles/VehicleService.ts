import { supabase } from "@/integrations/supabase/client";

export class VehicleService {
  static async fetchVehicles(tenantId: string) {
    return supabase
      .from("vehicles")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
  }

  static async saveVehicle(payload: any, editingId?: string | null) {
    if (editingId) {
      return supabase.from("vehicles").update(payload).eq("id", editingId);
    } else {
      return supabase.from("vehicles").insert(payload);
    }
  }

  static async deleteVehicle(id: string) {
    return supabase.from("vehicles").delete().eq("id", id);
  }
}
