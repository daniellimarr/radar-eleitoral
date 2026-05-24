import { supabase } from "@/integrations/supabase/client";

export const demandService = {
  async fetchDemands(tenantId: string, search?: string) {
    let query = supabase
      .from("demands")
      .select("*, contacts(name, leader_id)")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async saveDemand(payload: any) {
    const { data, error } = await supabase.from("demands").insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("demands")
      .update({ status: status as any })
      .eq("id", id);
    if (error) throw error;
  },

  async fetchDocuments(demandId: string) {
    const { data, error } = await supabase
      .from("demand_documents")
      .select("*")
      .eq("demand_id", demandId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async uploadDocument(demandId: string, tenantId: string, userId: string, file: File) {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/${demandId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("demand-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from("demand_documents").insert({
      demand_id: demandId,
      tenant_id: tenantId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: path,
      uploaded_by: userId,
    });

    if (dbError) throw dbError;
  },

  async deleteDocument(doc: any) {
    await supabase.storage.from("demand-documents").remove([doc.storage_path]);
    const { error } = await supabase.from("demand_documents").delete().eq("id", doc.id);
    if (error) throw error;
  },

  async getSignedUrl(storagePath: string, expiry = 60) {
    const { data, error } = await supabase.storage.from("demand-documents").createSignedUrl(storagePath, expiry);
    if (error) throw error;
    return data?.signedUrl;
  }
};
