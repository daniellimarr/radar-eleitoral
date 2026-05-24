import { useState, useEffect, useCallback } from "react";
import { demandService } from "@/services/demandService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useDemands() {
  const { tenantId, user } = useAuth();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const MAIN_TENANT = "a0000000-0000-0000-0000-000000000001";
  const effectiveTenantId = tenantId || MAIN_TENANT;

  const fetchDemands = useCallback(async () => {
    try {
      const data = await demandService.fetchDemands(effectiveTenantId, search);
      setDemands(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [effectiveTenantId, search]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  const saveDemand = async (form: any) => {
    if (!user) {
      toast.error("Faça login para cadastrar demandas.");
      return;
    }
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        tenant_id: effectiveTenantId, 
        responsible_id: user.id,
        contact_id: form.contact_id || null
      };
      // Remove leader_id from payload as it's not in the table
      delete (payload as any).leader_id;
      
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
