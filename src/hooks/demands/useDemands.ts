import { useState, useEffect, useCallback } from "react";
import { DemandService } from "@/services/demands/DemandService";
import { toast } from "sonner";

export function useDemands(tenantId: string | null, search: string) {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDemands = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await DemandService.fetchDemands(tenantId, search);
      if (error) throw error;
      setDemands(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar demandas: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await DemandService.updateStatus(id, status);
      if (error) throw error;
      fetchDemands();
      return true;
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
      return false;
    }
  };

  return {
    demands,
    loading,
    refresh: fetchDemands,
    updateStatus
  };
}
