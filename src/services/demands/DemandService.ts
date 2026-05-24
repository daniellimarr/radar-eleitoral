import { BaseService } from "../BaseService";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export class DemandService extends BaseService {
  static async fetchDemands(tenantId: string, search?: string) {
    const client = this.getClient();
    let query = client
      .from("demands")
      .select("*, contacts(name, leader_id)")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    
    if (search) query = query.ilike("title", `%${search}%`);
    
    return await query;
  }

  static async saveDemand(payload: TablesInsert<"demands">) {
    return this.getClient().from("demands").insert([payload]);
  }

  static async updateStatus(id: string, status: TablesUpdate<"demands">["status"]) {
    return this.getClient()
      .from("demands")
      .update({ status: status as any })
      .eq("id", id);
  }

  static async fetchDocuments(demandId: string) {
    return this.getClient()
      .from("demand_documents")
      .select("*")
      .eq("demand_id", demandId)
      .order("created_at", { ascending: false });
  }

  static async uploadDocument(tenantId: string, demandId: string, file: File) {
    const client = this.getClient();
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/${demandId}/${crypto.randomUUID()}.${ext}`;

    const { data, error: uploadError } = await client.storage
      .from("demand-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) return { error: uploadError };

    return { path, data };
  }

  static async registerDocument(docData: TablesInsert<"demand_documents">) {
    return this.getClient().from("demand_documents").insert(docData);
  }

  static async deleteDocument(docId: string, storagePath: string) {
    const client = this.getClient();
    await client.storage.from("demand-documents").remove([storagePath]);
    return client.from("demand_documents").delete().eq("id", docId);
  }
}
