import { useState, useEffect, useCallback } from "react";
import { ContactService } from "@/services/contacts/ContactService";
import { toast } from "sonner";

export function useContacts(tenantId: string | null, search: string) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [{ data, error }, { count }] = await Promise.all([
        ContactService.fetchContacts(tenantId, search),
        ContactService.fetchTotalCount(tenantId)
      ]);

      if (error) throw error;
      setContacts(data || []);
      setTotalContacts(count || 0);
    } catch (err: any) {
      toast.error("Erro ao carregar contatos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const deleteContact = async (id: string) => {
    try {
      const { error } = await ContactService.deleteContact(id);
      if (error) throw error;
      toast.success("Contato removido");
      fetchContacts();
      return true;
    } catch (err: any) {
      toast.error("Erro ao excluir contato: " + err.message);
      return false;
    }
  };

  return {
    contacts,
    totalContacts,
    loading,
    refresh: fetchContacts,
    deleteContact
  };
}
