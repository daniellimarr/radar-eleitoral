import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Contact } from "@/types";
import { isValidCpf, onlyDigits } from "@/lib/cpf";

type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

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
    const { data, error } = await supabase.rpc("get_tenant_leaders", {
      p_tenant_id: tenantId,
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Verifica no backend se o CPF já pertence a outro contato ativo do mesmo gabinete.
   * Retorna o nome do contato existente (ou null quando o CPF está livre).
   */
  async findContactByCpf(tenantId: string, cpf: string, excludeId?: string | null): Promise<string | null> {
    const digits = onlyDigits(cpf);
    if (digits.length !== 11) return null;

    const { data, error } = await (supabase as any).rpc("check_contact_cpf_exists", {
      p_tenant_id: tenantId,
      p_cpf: digits,
      p_exclude_id: excludeId ?? null,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row?.contact_name ?? (row?.exists_contact ? "outro contato" : null);
  },

  async saveContact(payload: Record<string, unknown>, editingId?: string | null) {
    const databasePayload = normalizeNullableDatabaseFields(payload);

    // Validação de CPF único (formato + duplicidade no banco).
    // Só processa quando o campo foi enviado, para não apagar o CPF existente em edições parciais.
    if ("cpf" in databasePayload) {
      const rawCpf = typeof databasePayload.cpf === "string" ? databasePayload.cpf : "";
      const cpfDigits = onlyDigits(rawCpf);
      if (cpfDigits) {
        if (!isValidCpf(cpfDigits)) {
          throw new Error("CPF inválido. Verifique os dígitos informados.");
        }
        const tenantForCheck = typeof databasePayload.tenant_id === "string" ? databasePayload.tenant_id : null;
        if (tenantForCheck) {
          const duplicated = await contactService.findContactByCpf(tenantForCheck, cpfDigits, editingId);
          if (duplicated) {
            throw new Error(`Já existe um contato cadastrado com este CPF: ${duplicated}.`);
          }
        }
        databasePayload.cpf = cpfDigits;
      } else {
        databasePayload.cpf = null;
      }
    }



    if (editingId) {
      const { data, error } = await supabase
        .from("contacts")
        .update(databasePayload as ContactUpdate)
        .eq("id", editingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const name = databasePayload.name;
      const tenantId = databasePayload.tenant_id;

      if (typeof name !== "string" || !name.trim()) {
        throw new Error("Nome do contato é obrigatório.");
      }

      if (typeof tenantId !== "string" || !tenantId.trim()) {
        throw new Error("Gabinete não identificado para salvar o contato.");
      }

      const insertPayload = {
        ...databasePayload,
        name,
        tenant_id: tenantId,
      } as ContactInsert;

      const { data, error } = await supabase
        .from("contacts")
        .insert(insertPayload)
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

  async ensureLeaderAndLink(contactId: string, tenantId: string, userId: string): Promise<string | null> {
    // 1) Garante o registro na tabela de líderes
    const { data: existingLeader } = await supabase
      .from("leaders").select("id").eq("contact_id", contactId).maybeSingle();

    if (!existingLeader) {
      const { error: leaderError } = await supabase
        .from("leaders")
        .insert({ contact_id: contactId, tenant_id: tenantId });
      if (leaderError && leaderError.code !== "23505") throw leaderError;
    }

    // 2) Garante o link público de cadastro
    const { data: existingLink } = await supabase
      .from("registration_links")
      .select("id, slug")
      .eq("leader_contact_id", contactId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existingLink?.slug) return existingLink.slug;

    const { data: contact } = await supabase
      .from("contacts_decrypted").select("name, nickname").eq("id", contactId).maybeSingle();

    const generateSlug = (name: string) =>
      name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    let slug = generateSlug(contact?.nickname || contact?.name || contactId) || contactId;
    const { data: slugExists } = await supabase
      .from("registration_links").select("id, tenant_id").eq("slug", slug).maybeSingle();

    if (slugExists) {
      if (slugExists.tenant_id === tenantId) {
        const { error } = await supabase
          .from("registration_links")
          .update({ leader_contact_id: contactId, coordinator_id: userId, is_active: true })
          .eq("id", slugExists.id);
        if (error) throw error;
        return slug;
      }
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const { error: insertError } = await supabase
      .from("registration_links")
      .insert({ tenant_id: tenantId, slug, leader_contact_id: contactId, coordinator_id: userId, is_active: true });
    if (insertError) throw insertError;

    return slug;
  },

  async removeLeaderRole(contactId: string) {
    await supabase.from("leaders").delete().eq("contact_id", contactId);
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

