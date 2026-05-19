import { supabase } from "@/integrations/supabase/client";

export class FinancialService {
  static async fetchDonations(tenantId: string) {
    return supabase
      .from("donations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("data", { ascending: false });
  }

  static async fetchExpenses(tenantId: string) {
    return supabase
      .from("expenses")
      .select("*, suppliers(nome)")
      .eq("tenant_id", tenantId)
      .order("data", { ascending: false });
  }

  static async fetchSuppliers(tenantId: string) {
    return supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("nome");
  }

  static async saveDonation(payload: any, editingId?: string | null) {
    if (editingId) {
      return supabase.from("donations").update(payload).eq("id", editingId);
    } else {
      return supabase.from("donations").insert(payload);
    }
  }

  static async saveExpense(payload: any, editingId?: string | null) {
    if (editingId) {
      return supabase.from("expenses").update(payload).eq("id", editingId);
    } else {
      return supabase.from("expenses").insert(payload);
    }
  }

  static async saveSupplier(payload: any, editingId?: string | null) {
    if (editingId) {
      return supabase.from("suppliers").update(payload).eq("id", editingId);
    } else {
      return supabase.from("suppliers").insert(payload);
    }
  }

  static async deleteDonation(id: string) {
    return supabase.from("donations").delete().eq("id", id);
  }

  static async deleteExpense(id: string) {
    return supabase.from("expenses").delete().eq("id", id);
  }

  static async deleteSupplier(id: string) {
    return supabase.from("suppliers").delete().eq("id", id);
  }
}
