import { supabase } from "@/integrations/supabase/client";

export class ContactService {
  static async fetchContacts(tenantId: string, search?: string, limit = 100) {
    let query = supabase
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    return await query;
  }

  static async fetchTotalCount(tenantId: string) {
    return supabase
      .from("contacts_decrypted")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);
  }

  static async fetchLeaders(tenantId: string) {
    return supabase
      .from("contacts_decrypted")
      .select("id, name, nickname")
      .eq("tenant_id", tenantId)
      .eq("is_leader", true)
      .is("deleted_at", null)
      .order("name");
  }

  static async saveContact(payload: any, editingId?: string | null) {
    if (editingId) {
      return supabase.from("contacts").update(payload).eq("id", editingId);
    } else {
      return supabase.from("contacts").insert(payload).select("id").single();
    }
  }

  static async deleteContact(id: string) {
    return supabase.from("contacts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  }
}
