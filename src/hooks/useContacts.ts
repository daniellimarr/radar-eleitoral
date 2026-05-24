import { useState, useEffect, useCallback } from "react";
import { contactService } from "@/services/contactService";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Contact } from "@/types";

export function useContacts() {
  const { tenantId, profile, hasRole, user } = useAuth();
  const { contactLimit } = useSubscription();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const isOperador = hasRole("operador");

  const MAIN_TENANT = "a0000000-0000-0000-0000-000000000001";
  const effectiveTenantId = tenantId || MAIN_TENANT;

  const fetchContacts = useCallback(async () => {
    try {
      const data = await contactService.fetchContacts(effectiveTenantId, search);
      setContacts(data as Contact[]);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [effectiveTenantId, search]);

  const fetchLeaders = useCallback(async () => {
    try {
      const data = await contactService.fetchLeaders(effectiveTenantId, isOperador, profile?.full_name);
      setLeaders(data);
    } catch (error: any) {
      console.error("Error fetching leaders:", error);
    }
  }, [effectiveTenantId, isOperador, profile?.full_name]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  const saveContact = async (form: any, editingId: string | null) => {
    if (!user) {
      toast.error("Faça login para cadastrar contatos.");
      return;
    }

    if (!editingId && contactLimit !== Infinity && contacts.length >= contactLimit) {
      toast.error(`Limite de ${contactLimit.toLocaleString()} contatos atingido.`);
      return;
    }

    setLoading(true);
    try {
      const sanitizedPayload = { 
        ...form, 
        tenant_id: effectiveTenantId, 
        registered_by: user.id,
        leader_id: form.leader_id === "" ? null : form.leader_id 
      };
      const saved = await contactService.saveContact(sanitizedPayload, editingId);
      
      if (form.is_leader && saved) {
        await contactService.ensureLeaderAndLink(saved.id, effectiveTenantId, user.id);
      }
      
      toast.success(editingId ? "Contato atualizado!" : "Contato cadastrado!");
      fetchContacts();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await contactService.deleteContact(id);
      toast.success("Contato removido");
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return {
    contacts,
    leaders,
    loading,
    search,
    setSearch,
    saveContact,
    deleteContact,
    refresh: fetchContacts
  };
}
