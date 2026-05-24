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

  const fetchContacts = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await contactService.fetchContacts(tenantId, search);
      setContacts(data as Contact[]);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [tenantId, search]);

  const fetchLeaders = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await contactService.fetchLeaders(tenantId, isOperador, profile?.full_name);
      setLeaders(data);
    } catch (error: any) {
      console.error("Error fetching leaders:", error);
    }
  }, [tenantId, isOperador, profile?.full_name]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  const saveContact = async (form: any, editingId: string | null) => {
    if (!tenantId || !user) {
      toast.error("Sessão inválida. Recarregue a página.");
      return;
    }

    if (!editingId && contactLimit !== Infinity && contacts.length >= contactLimit) {
      toast.error(`Limite de ${contactLimit.toLocaleString()} contatos atingido.`);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form, tenant_id: tenantId, registered_by: user.id };
      const saved = await contactService.saveContact(payload, editingId);
      
      if (form.is_leader && saved) {
        await contactService.ensureLeaderAndLink(saved.id, tenantId, user.id);
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
