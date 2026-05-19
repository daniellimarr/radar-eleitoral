import { useState, useEffect, useCallback } from "react";
import { FinancialService } from "@/services/financial/FinancialService";
import { CampaignService } from "@/services/campaign/CampaignService";
import { toast } from "sonner";

export function useFinancial(tenantId: string | null) {
  const [donations, setDonations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [d, e, s, c] = await Promise.all([
        FinancialService.fetchDonations(tenantId),
        FinancialService.fetchExpenses(tenantId),
        FinancialService.fetchSuppliers(tenantId),
        CampaignService.fetchCampaigns(tenantId),
      ]);
      setDonations(d.data || []);
      setExpenses(e.data || []);
      setSuppliers(s.data || []);
      setCampaigns(c.data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar dados financeiros: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deleteDonation = async (id: string) => {
    try {
      await FinancialService.deleteDonation(id);
      toast.success("Removido");
      fetchAll();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir doação");
      return false;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await FinancialService.deleteExpense(id);
      toast.success("Removido");
      fetchAll();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir despesa");
      return false;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await FinancialService.deleteSupplier(id);
      toast.success("Removido");
      fetchAll();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir fornecedor");
      return false;
    }
  };

  return {
    donations,
    expenses,
    suppliers,
    campaigns,
    loading,
    refresh: fetchAll,
    deleteDonation,
    deleteExpense,
    deleteSupplier
  };
}
