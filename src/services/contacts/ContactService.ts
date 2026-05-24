import { BaseService } from "../BaseService";
import { Contact } from "@/types/contacts";

export class ContactService extends BaseService {
  static async fetchContacts(tenantId: string, search?: string, limit = 100) {
    const client = this.getClient();
    const { data: contactsData, error: contactsError } = await client
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (contactsError) return { data: null, error: contactsError };

    const leaderIds = contactsData
      ?.map(c => c.leader_id)
      .filter((id): id is string => !!id) || [];

    let leadersMap: Record<string, string> = {};
    if (leaderIds.length > 0) {
      const { data: leadersData } = await client
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
      const searchLower = search.toLowerCase();
      const filtered = contactsWithLeaderNames?.filter(c => 
        c.name.toLowerCase().includes(searchLower) || 
        (c.nickname && c.nickname.toLowerCase().includes(searchLower)) ||
        (c.phone && c.phone.includes(search))
      );
      return { data: filtered || [], error: null };
    }

    return { data: (contactsWithLeaderNames || []) as Contact[], error: null };
  }

  static async fetchTotalCount(tenantId: string) {
    return this.getClient()
      .from("contacts_decrypted")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);
  }

  static async fetchLeaders(tenantId: string) {
    return this.getClient()
      .from("contacts_decrypted")
      .select("id, name, nickname")
      .eq("tenant_id", tenantId)
      .eq("is_leader", true)
      .is("deleted_at", null)
      .order("name");
  }

  static async saveContact(payload: Partial<Contact>, editingId?: string | null) {
    const client = this.getClient();
    if (editingId) {
      return client.from("contacts").update(payload).eq("id", editingId);
    } else {
      return client.from("contacts").insert(payload).select("id").single();
    }
  }

  static async deleteContact(id: string) {
    const client = this.getClient();
    const { error: contactError } = await client
      .from("contacts")
      .update({ 
        deleted_at: new Date().toISOString(),
        is_leader: false 
      })
      .eq("id", id);
    
    if (contactError) return { error: contactError };

    return client
      .from("leaders")
      .delete()
      .eq("contact_id", id);
  }
}
