import { useState, useEffect, useCallback } from "react";
import { AppointmentService } from "@/services/appointments/AppointmentService";
import { toast } from "sonner";

export function useAppointments(tenantId: string | null) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [visitRequests, setVisitRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [apptRes, visitRes] = await Promise.all([
        AppointmentService.fetchAppointments(tenantId),
        AppointmentService.fetchVisitRequests(tenantId),
      ]);
      if (apptRes.error) throw apptRes.error;
      if (visitRes.error) throw visitRes.error;

      setAppointments(apptRes.data || []);
      setVisitRequests(visitRes.data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar agenda: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteItem = async (id: string, type: "appointment" | "visit") => {
    try {
      const { error } = type === "appointment" 
        ? await AppointmentService.deleteAppointment(id) 
        : await AppointmentService.deleteVisitRequest(id);
      
      if (error) throw error;
      toast.success("Compromisso excluído!");
      fetchData();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir compromisso: " + err.message);
      return false;
    }
  };

  const confirmItem = async (id: string, type: "appointment" | "visit") => {
    try {
      const { error } = type === "appointment" 
        ? await AppointmentService.confirmAppointment(id) 
        : await AppointmentService.confirmVisitRequest(id);
      
      if (error) throw error;
      toast.success("Confirmado!");
      fetchData();
      return true;
    } catch (err: any) {
      toast.error("Erro ao confirmar: " + err.message);
      return false;
    }
  };

  return {
    appointments,
    visitRequests,
    loading,
    refresh: fetchData,
    deleteItem,
    confirmItem
  };
}
