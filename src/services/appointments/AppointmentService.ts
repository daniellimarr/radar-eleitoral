import { supabase } from "@/integrations/supabase/client";

export class AppointmentService {
  static async fetchAppointments(tenantId: string) {
    return supabase
      .from("appointments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("start_time", { ascending: true });
  }

  static async fetchVisitRequests(tenantId: string) {
    return supabase
      .from("visit_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("requested_date", { ascending: true });
  }

  static async saveAppointment(payload: any) {
    return supabase.from("appointments").insert(payload);
  }

  static async deleteAppointment(id: string) {
    return supabase.from("appointments").delete().eq("id", id);
  }

  static async deleteVisitRequest(id: string) {
    return supabase.from("visit_requests").delete().eq("id", id);
  }

  static async confirmAppointment(id: string) {
    return supabase.from("appointments").update({ status: "confirmado" }).eq("id", id);
  }

  static async confirmVisitRequest(id: string) {
    return supabase.from("visit_requests").update({ status: "confirmado" }).eq("id", id);
  }
}
