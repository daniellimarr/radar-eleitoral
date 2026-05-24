import { supabase } from "@/integrations/supabase/client";
import { Campaign } from "@/types";

export const campaignService = {
  async fetchCampaigns(tenantId: string) {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async saveCampaign(payload: Partial<Campaign>, editingId?: string | null) {
    if (editingId) {
      const { data, error } = await supabase
        .from("campaigns")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("campaigns")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteCampaign(id: string) {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) throw error;
  }
};
