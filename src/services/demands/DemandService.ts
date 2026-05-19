import { supabase } from "@/integrations/supabase/client";

export class DemandService {
  static async fetchDemands(tenantId: string, search?: string) {
    let query = supabase
      .from("demands")
      .select("*, contacts(name, leader_id)")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    
    if (search) query = query.ilike("title", `%${search}%`);
    
    return await query;
  }

  static async saveDemand(payload: any) {
    return supabase.from("demands").insert([payload]);
  }

  static async updateStatus(id: string, status: string) {
    return supabase
      .from("demands")
      .update({ status: status as any })
      .eq("id", id);
  }

  static async fetchDocuments(demandId: string) {
    return supabase
      .from("demand_documents")
      .select("*")
      .eq("demand_id", demandId)
      .order("created_at", { ascending: false });
  }

  static async uploadDocument(tenantId: string, demandId: string, file: File) {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/${demandId}/${crypto.randomUUID()}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from("demand-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) return { error: uploadError };

    return { path, data };
  }

  static async registerDocument(docData: any) {
    return supabase.from("demand_documents").insert(docData);
  }

  static async deleteDocument(docId: string, storagePath: string) {
    await supabase.storage.from("demand-documents").remove([storagePath]);
    return supabase.from("demand_documents").delete().eq("id", docId);
  }
}
