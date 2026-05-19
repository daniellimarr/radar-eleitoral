import { useState, useEffect, useCallback } from "react";
import { VehicleService } from "@/services/vehicles/VehicleService";
import { toast } from "sonner";

export function useVehicles(tenantId: string | null) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVehicles = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await VehicleService.fetchVehicles(tenantId);
      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar veículos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const deleteVehicle = async (id: string) => {
    try {
      const { error } = await VehicleService.deleteVehicle(id);
      if (error) throw error;
      toast.success("Veículo removido");
      fetchVehicles();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir veículo: " + err.message);
      return false;
    }
  };

  return {
    vehicles,
    loading,
    refresh: fetchVehicles,
    deleteVehicle
  };
}
