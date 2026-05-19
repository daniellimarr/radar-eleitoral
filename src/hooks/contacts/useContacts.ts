import { useCallback } from "react";
import { ContactService } from "@/services/contacts/ContactService";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useContacts(tenantId: string | null, search: string) {
  const queryClient = useQueryClient();

  // Otimização: Uso de React Query para Cache e Gerenciamento de Estado Assíncrono
  const { data: contactsData, isLoading: loading, refetch } = useQuery({
    queryKey: ['contacts', tenantId, search],
    queryFn: async () => {
      if (!tenantId) return { contacts: [], total: 0 };
      const [{ data, error }, { count }] = await Promise.all([
        ContactService.fetchContacts(tenantId, search),
        ContactService.fetchTotalCount(tenantId)
      ]);
      if (error) throw error;
      return { contacts: data || [], total: count || 0 };
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ContactService.deleteContact(id),
    onSuccess: () => {
      toast.success("Contato removido");
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err: any) => {
      toast.error("Erro ao excluir contato: " + err.message);
    }
  });

  return {
    contacts: contactsData?.contacts || [],
    totalContacts: contactsData?.total || 0,
    loading,
    refresh: refetch,
    deleteContact: deleteMutation.mutateAsync
  };
}
