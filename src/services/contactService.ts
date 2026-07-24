import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types";

const CONTACT_DATE_FIELDS = new Set(["birth_date"]);
const CONTACT_UUID_FIELDS = new Set(["leader_id", "tenant_id", "registered_by"]);

function normalizeNullableDatabaseFields(payload: Record<string, unknown>) {
  return Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined) return acc;

    if (typeof value === "string" && value.trim() === "") {
      acc[key] = CONTACT_DATE_FIELDS.has(key) || CONTACT_UUID_FIELDS.has(key) ? null : value;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

export const contactService = {
  async fetchContacts(tenantId: string, search?: string) {
    let query = supabase
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async fetchLeaders(tenantId: string, isOperador: boolean, profileName?: string) {
    if (isOperador && profileName) {
      const { data: leadersData, error } = await supabase
        .from("leaders")
        .select("id, contact_id, contacts:contact_id(id, name, nickname)")
        .eq("tenant_id", tenantId);

      if (error) throw error;

      const allLeaders = (leadersData || []).map((l: any) => ({
        id: l.contact_id,
        name: l.contacts?.name || "",
        nickname: l.contacts?.nickname || "",
      }));

      return allLeaders.filter(
        (l: any) => 
          l.name.toLowerCase() === profileName.toLowerCase() ||
          (l.nickname && l.nickname.toLowerCase() === profileName.toLowerCase())
      );
    } else {
      const { data, error } = await supabase
        .from("contacts_decrypted")
        .select("id, name, nickname")
        .eq("tenant_id", tenantId)
        .eq("is_leader", true)
        .is("deleted_at", null)
        .order("name");
      
      if (error) throw error;
      return data || [];
    }
  },

  async fetchLeadersFull(tenantId: string) {
    const { data, error } = await supabase
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_leader", true)
      .is("deleted_at", null)
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async saveContact(payload: Record<string, unknown>, editingId?: string | null) {
    const databasePayload = normalizeNullableDatabaseFields(payload);

    if (editingId) {
      const { data, error } = await supabase
        .from("contacts")
        .update(databasePayload)
        .eq("id", editingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("contacts")
        .insert(databasePayload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteContact(id: string) {
    const { error } = await supabase
      .from("contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async ensureLeaderAndLink(contactId: string, tenantId: string, userId: string) {
    // Ensure leader record exists
    const { data: existingLeader } = await supabase
      .from("leaders").select("id").eq("contact_id", contactId).maybeSingle();
    
    if (!existingLeader) {
      await supabase.from("leaders").insert({ contact_id: contactId, tenant_id: tenantId });
    }

    // Ensure registration link exists
    const { data: existingLink } = await supabase
      .from("registration_links").select("id").eq("leader_contact_id", contactId).eq("tenant_id", tenantId).maybeSingle();
    
    if (!existingLink) {
      const { data: contact } = await supabase.from("contacts_decrypted").select("name, nickname").eq("id", contactId).single();
      
      const generateSlug = (name: string) =>
        name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      let slug = generateSlug(contact?.nickname || contact?.name || contactId);
      const { data: slugExists } = await supabase.from("registration_links").select("id, tenant_id").eq("slug", slug).maybeSingle();
      
      if (slugExists && slugExists.tenant_id !== tenantId) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      if (!slugExists) {
        await supabase.from("registration_links").insert({ tenant_id: tenantId, slug, leader_contact_id: contactId, coordinator_id: userId });
      } else if (slugExists.tenant_id === tenantId) {
        await supabase.from("registration_links").update({ leader_contact_id: contactId, coordinator_id: userId }).eq("id", slugExists.id);
      }
    }
  },

  async fetchVoterCounts(tenantId: string, leaderIds: string[]) {
    const { data, error } = await supabase
      .from("contacts_decrypted")
      .select("leader_id")
      .in("leader_id", leaderIds)
      .is("deleted_at", null);
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    (data || []).forEach((v: any) => {
      counts[v.leader_id] = (counts[v.leader_id] || 0) + 1;
    });
    return counts;
  },

  async fetchVotersByLeader(leaderId: string) {
    const { data, error } = await supabase
      .from("contacts_decrypted")
      .select("id, name, phone, city, engagement")
      .eq("leader_id", leaderId)
      .is("deleted_at", null)
      .order("name");
    
    if (error) throw error;
    return data || [];
  },

  async markAsNotLeader(id: string) {
    const { error: contactError } = await supabase
      .from("contacts")
      .update({ deleted_at: new Date().toISOString(), is_leader: false })
      .eq("id", id);
    if (contactError) throw contactError;

    const { error: leaderError } = await supabase
      .from("leaders")
      .delete()
      .eq("contact_id", id);
    if (leaderError) throw leaderError;
  }
};

