import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { demandService } from "@/services/demandService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useDemands() {
  const { tenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const MAIN_TENANT = "a0000000-0000-0000-0000-000000000001";
  const effectiveTenantId = tenantId || MAIN_TENANT;

  const { data: demands = [], isLoading: demandsLoading } = useQuery({
    queryKey: ["demands", effectiveTenantId, search],
    queryFn: () => demandService.fetchDemands(effectiveTenantId, search),
    enabled: !!effectiveTenantId,
  });

  const saveMutation = useMutation({
    mutationFn: async (form: any) => {
      if (!user) throw new Error("Faça login para cadastrar demandas.");
      
      const payload = { 
        ...form, 
        tenant_id: effectiveTenantId, 
        responsible_id: user.id,
        contact_id: form.contact_id || null
      };
      // Remove leader_id from payload as it's not in the table
      delete (payload as any).leader_id;
      
      return demandService.saveDemand(payload);
    },
    onSuccess: () => {
      toast.success("Demanda cadastrada!");
      queryClient.invalidateQueries({ queryKey: ["demands"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => demandService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const saveDemand = async (form: any) => {
    try {
      await saveMutation.mutateAsync(form);
      return true;
    } catch {
      return false;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  return {
    demands,
    loading: demandsLoading || saveMutation.isPending || updateStatusMutation.isPending,
    search,
    setSearch,
    saveDemand,
    updateStatus,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["demands"] })
  };
}
