import { useState, useEffect, useCallback } from "react";
import { MarketingService } from "@/services/marketing/MarketingService";
import { toast } from "sonner";

export function useMarketing(tenantId: string | null) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await MarketingService.fetchContentPlans(tenantId);
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar planos de marketing: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const deleteItem = async (id: string) => {
    try {
      const { error } = await MarketingService.deleteContentPlan(id);
      if (error) throw error;
      toast.success("Removido");
      fetchItems();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir conteúdo: " + err.message);
      return false;
    }
  };

  return {
    items,
    loading,
    refresh: fetchItems,
    deleteItem
  };
}
