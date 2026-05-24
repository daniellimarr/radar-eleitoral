import { useState, useCallback } from "react";
import { MAIN_TENANT } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "@/services/contactService";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Contact } from "@/types";

export function useContacts() {
  const { tenantId, profile, hasRole, user } = useAuth();
  const { contactLimit } = useSubscription();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const isOperador = hasRole("operador");

  const effectiveTenantId = tenantId || MAIN_TENANT;

  const { data: contacts = [], isLoading: contactsLoading, refetch: refetchContacts } = useQuery({
    queryKey: ["contacts", effectiveTenantId, search],
    queryFn: () => contactService.fetchContacts(effectiveTenantId, search),
    enabled: !!effectiveTenantId,
  });

  const { data: leaders = [], isLoading: leadersLoading, refetch: refetchLeaders } = useQuery({
    queryKey: ["leaders", effectiveTenantId, isOperador, profile?.full_name],
    queryFn: () => contactService.fetchLeaders(effectiveTenantId, isOperador, profile?.full_name),
    enabled: !!effectiveTenantId,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ form, editingId }: { form: any; editingId: string | null }) => {
      if (!user) throw new Error("Faça login para cadastrar contatos.");

      if (!editingId && contactLimit !== Infinity && contacts.length >= contactLimit) {
        throw new Error(`Limite de ${contactLimit.toLocaleString()} contatos atingido.`);
      }

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
      return saved;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.editingId ? "Contato atualizado!" : "Contato cadastrado!");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["operator-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactService.deleteContact(id),
    onSuccess: () => {
      toast.success("Contato removido");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["operator-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const saveContact = async (form: any, editingId: string | null) => {
    try {
      await saveMutation.mutateAsync({ form, editingId });
      return true;
    } catch {
      return false;
    }
  };

  const deleteContact = async (id: string) => {
    deleteMutation.mutate(id);
  };

  return {
    contacts: contacts as Contact[],
    leaders,
    loading: contactsLoading || leadersLoading || saveMutation.isPending || deleteMutation.isPending,
    search,
    setSearch,
    saveContact,
    deleteContact,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["contacts"] })
  };
}
