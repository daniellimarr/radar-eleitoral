import { useState, useEffect, useCallback } from "react";
import { LeaderService } from "@/services/contacts/LeaderService";
import { toast } from "sonner";

export function useLeaders(tenantId: string | null) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [voterCounts, setVoterCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchLeaders = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await LeaderService.fetchLeaders(tenantId);
      if (error) throw error;
      
      const leaderList = data || [];
      setLeaders(leaderList);

      if (leaderList.length > 0) {
        const leaderIds = leaderList.map((l: any) => l.id);
        const { data: voterData } = await LeaderService.fetchVoterCounts(leaderIds);
        
        const counts: Record<string, number> = {};
        (voterData || []).forEach((v: any) => {
          counts[v.leader_id] = (counts[v.leader_id] || 0) + 1;
        });
        setVoterCounts(counts);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar lideranças: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  const deleteLeader = async (id: string) => {
    try {
      const { error } = await LeaderService.deleteLeader(id);
      if (error) throw error;
      toast.success("Liderança excluída com sucesso");
      fetchLeaders();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir liderança: " + err.message);
      return false;
    }
  };

  return {
    leaders,
    voterCounts,
    loading,
    refresh: fetchLeaders,
    deleteLeader
  };
}
