import { useState, useCallback } from "react";
import { AuthService } from "@/services/AuthService";

export function usePermissions() {
  const [roles, setRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async (userId: string, tenantId: string | null) => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        AuthService.getRoles(userId),
        tenantId ? AuthService.getPermissions(userId, tenantId) : Promise.resolve({ data: [] })
      ]);
      
      setRoles(rolesRes.data?.map((r: any) => r.role) || []);
      setUserPermissions(permsRes.data?.map((p: any) => p.module) || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setRoles([]);
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPermissions = useCallback(() => {
    setRoles([]);
    setUserPermissions([]);
  }, []);

  return { roles, userPermissions, loading, fetchPermissions, clearPermissions };
}
