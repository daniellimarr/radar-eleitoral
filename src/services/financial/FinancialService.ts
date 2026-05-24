import { BaseService } from "../BaseService";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export class FinancialService extends BaseService {
  static async fetchDonations(tenantId: string) {
    return this.getClient()
      .from("donations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("data", { ascending: false });
  }

  static async fetchExpenses(tenantId: string) {
    return this.getClient()
      .from("expenses")
      .select("*, suppliers(nome)")
      .eq("tenant_id", tenantId)
      .order("data", { ascending: false });
  }

  static async fetchSuppliers(tenantId: string) {
    return this.getClient()
      .from("suppliers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("nome");
  }

  static async saveDonation(payload: TablesInsert<"donations"> | TablesUpdate<"donations">, editingId?: string | null) {
    const client = this.getClient();
    if (editingId) {
      return client.from("donations").update(payload as TablesUpdate<"donations">).eq("id", editingId);
    } else {
      return client.from("donations").insert(payload as TablesInsert<"donations">);
    }
  }

  static async saveExpense(payload: TablesInsert<"expenses"> | TablesUpdate<"expenses">, editingId?: string | null) {
    const client = this.getClient();
    if (editingId) {
      return client.from("expenses").update(payload as TablesUpdate<"expenses">).eq("id", editingId);
    } else {
      return client.from("expenses").insert(payload as TablesInsert<"expenses">);
    }
  }

  static async saveSupplier(payload: TablesInsert<"suppliers"> | TablesUpdate<"suppliers">, editingId?: string | null) {
    const client = this.getClient();
    if (editingId) {
      return client.from("suppliers").update(payload as TablesUpdate<"suppliers">).eq("id", editingId);
    } else {
      return client.from("suppliers").insert(payload as TablesInsert<"suppliers">);
    }
  }

  static async deleteDonation(id: string) {
    return this.getClient().from("donations").delete().eq("id", id);
  }

  static async deleteExpense(id: string) {
    return this.getClient().from("expenses").delete().eq("id", id);
  }

  static async deleteSupplier(id: string) {
    return this.getClient().from("suppliers").delete().eq("id", id);
  }
}
