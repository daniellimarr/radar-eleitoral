import { useState, useEffect, useCallback } from "react";
import { UserDataMapper } from "@/services/user-management/UserDataMapper";
import { UserRow } from "@/types/user-management";
import { toast } from "sonner";

export function useUserList(tenantId: string | null) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await UserDataMapper.fetchAllUsers(tenantId);
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar lista de usuários");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, fetchUsers };
}
