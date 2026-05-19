import { useState, useEffect, useCallback } from "react";
import { CampaignService } from "@/services/campaign/CampaignService";
import { toast } from "sonner";

export function useCampaigns(tenantId: string | null) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await CampaignService.fetchCampaigns(tenantId);
      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar campanhas: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await CampaignService.deleteCampaign(id);
      if (error) throw error;
      toast.success("Campanha removida");
      fetchCampaigns();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir campanha: " + err.message);
      return false;
    }
  };

  return {
    campaigns,
    loading,
    refresh: fetchCampaigns,
    deleteCampaign
  };
}
