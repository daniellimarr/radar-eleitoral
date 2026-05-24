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
      const data = await contactService.fetchLeaders(tenantId, false);
      // We need more info for the ranking page than just id/name, so we use fetchContacts filtered by is_leader
      // Actually, let's use a more complete fetch for the ranking
      const fullLeaders = await contactService.fetchContacts(tenantId);
      const filteredLeaders = fullLeaders.filter(l => l.is_leader) as Contact[];
      setLeaders(filteredLeaders);

      if (filteredLeaders.length > 0) {
        const leaderIds = filteredLeaders.map(l => l.id);
        const counts = await contactService.fetchVoterCounts(tenantId, leaderIds);
        setVoterCounts(counts);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(true);
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
