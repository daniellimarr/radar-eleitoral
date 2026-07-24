import { useState, useEffect, useCallback } from "react";
import { contactService } from "@/services/contactService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Contact } from "@/types";

export function useLeaders() {
  const { tenantId } = useAuth();
  const [leaders, setLeaders] = useState<Contact[]>([]);
  const [voterCounts, setVoterCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchLeaders = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const fullLeaders = await contactService.fetchLeadersFull(tenantId);
      setLeaders(fullLeaders as Contact[]);

      if (fullLeaders.length > 0) {
        const leaderIds = fullLeaders.map((l: any) => l.id);
        const counts = await contactService.fetchVoterCounts(tenantId, leaderIds);
        setVoterCounts(counts);
      } else {
        setVoterCounts({});
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  const deleteLeader = async (id: string) => {
    try {
      await contactService.markAsNotLeader(id);
      toast.success("Liderança excluída com sucesso");
      fetchLeaders();
      return true;
    } catch (error: any) {
      toast.error(error.message);
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
