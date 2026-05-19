import { supabase } from "@/integrations/supabase/client";

export class CampaignService {
  static async fetchCampaigns(tenantId: string) {
    return supabase
      .from("campaigns")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
  }

  static async saveCampaign(payload: any, editingId?: string | null) {
    if (editingId) {
      return supabase.from("campaigns").update(payload).eq("id", editingId);
    } else {
      return supabase.from("campaigns").insert(payload);
    }
  }

  static async deleteCampaign(id: string) {
    return supabase.from("campaigns").delete().eq("id", id);
  }
}
