import { useState, useEffect, useCallback } from "react";
import { demandService } from "@/services/demandService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useDemands() {
  const { tenantId, user } = useAuth();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchDemands = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await demandService.fetchDemands(tenantId, search);
      setDemands(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [tenantId, search]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  const saveDemand = async (form: any) => {
    if (!tenantId || !user) return;
    setLoading(true);
    try {
      const payload = { ...form, tenant_id: tenantId, responsible_id: user.id };
      await demandService.saveDemand(payload);
      toast.success("Demanda cadastrada!");
      fetchDemands();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await demandService.updateStatus(id, status);
      fetchDemands();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return {
    demands,
    loading,
    search,
    setSearch,
    saveDemand,
    updateStatus,
    refresh: fetchDemands
  };
}
