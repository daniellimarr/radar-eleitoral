import { supabase } from "@/integrations/supabase/client";

export class MarketingService {
  static async fetchContentPlans(tenantId: string) {
    return supabase
      .from("content_plans")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("data_publicacao", { ascending: true });
  }

  static async saveContentPlan(payload: any, editingId?: string | null) {
    if (editingId) {
      return supabase.from("content_plans").update(payload).eq("id", editingId);
    } else {
      return supabase.from("content_plans").insert(payload);
    }
  }

  static async deleteContentPlan(id: string) {
    return supabase.from("content_plans").delete().eq("id", id);
  }
}
