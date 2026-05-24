import { supabase } from "@/integrations/supabase/client";

export class ContactService {
  static async fetchContacts(tenantId: string, search?: string, limit = 100) {
    const { data: contactsData, error: contactsError } = await supabase
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (contactsError) return { data: null, error: contactsError };

    // Buscar nomes das lideranças para os contatos que possuem leader_id
    const leaderIds = contactsData
      ?.map(c => c.leader_id)
      .filter((id): id is string => !!id) || [];

    let leadersMap: Record<string, string> = {};
    if (leaderIds.length > 0) {
      const { data: leadersData } = await supabase
        .from("contacts_decrypted")
        .select("id, name, nickname")
        .in("id", leaderIds);
      
      leadersMap = (leadersData || []).reduce((acc, curr) => {
        acc[curr.id] = curr.nickname || curr.name;
        return acc;
      }, {} as Record<string, string>);
    }

    const contactsWithLeaderNames = contactsData?.map(contact => ({
      ...contact,
      leader_name: contact.leader_id ? leadersMap[contact.leader_id] : null
    }));

    if (search) {
      const filtered = contactsWithLeaderNames?.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase())) ||
        (c.phone && c.phone.includes(search))
      );
      return { data: filtered || [], error: null };
    }

    return { data: contactsWithLeaderNames || [], error: null };
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
    const { error: contactError } = await supabase
      .from("contacts")
      .update({ 
        deleted_at: new Date().toISOString(),
        is_leader: false 
      })
      .eq("id", id);
    
    if (contactError) return { error: contactError };

    // Se o contato era uma liderança, remover da tabela de leaders também
    return supabase
      .from("leaders")
      .delete()
      .eq("contact_id", id);
  }
}