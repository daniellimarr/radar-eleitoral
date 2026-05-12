import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { UserRow } from "@/types/user-management";

export function useUserManagement() {
  const { tenantId, user, roles, hasRole } = useAuth();
  const { userLimit } = useSubscription();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = hasRole('super_admin');
  const isAdminGabinete = hasRole('admin_gabinete');
  const isAuthorized = isSuperAdmin || isAdminGabinete || hasRole('coordenador');
  const canDelete = roles.includes("super_admin") || roles.includes("admin_gabinete") || roles.includes("coordenador");
  const canManageAccess = isSuperAdmin || isAdminGabinete || hasRole('coordenador');

  const fetchUsers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    try {
      // Get profiles for this tenant (all statuses)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, status" as any)
        .eq("tenant_id", tenantId);

      // Also fetch pending profiles without tenant
      const { data: pendingProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, status" as any)
        .is("tenant_id", null)
        .filter("status", "eq", "pending");

      const allProfiles: any[] = [...(profiles as any[] || []), ...(pendingProfiles as any[] || [])];

      if (allProfiles.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = allProfiles.map((p) => p.user_id);

      // Get roles and permissions in parallel
      const [rolesRes, permsRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        supabase.from("user_permissions").select("user_id, module").eq("tenant_id", tenantId)
      ]);

      const rolesMap = new Map<string, string>();
      rolesRes.data?.forEach((r: any) => rolesMap.set(r.user_id, r.role));

      const permsMap = new Map<string, string[]>();
      permsRes.data?.forEach((p: any) => {
        if (!permsMap.has(p.user_id)) permsMap.set(p.user_id, []);
        permsMap.get(p.user_id)!.push(p.module);
      });

      const rows: UserRow[] = allProfiles.map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: "", // Email is not available in public profile for privacy
        role: rolesMap.get(p.user_id) || null,
        modules: permsMap.get(p.user_id) || [],
        status: p.status || "approved",
      }));

      setUsers(rows);
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

  const handleCreateUser = async (formData: any) => {
    const currentActiveCount = users.filter((u) => u.status === "approved").length;
    if (userLimit !== Infinity && currentActiveCount >= userLimit) {
      toast.error(`Limite de ${userLimit} usuários atingido. Faça upgrade do seu plano.`);
      return false;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: formData,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success("Usuário criado com sucesso!");
      fetchUsers();
      return true;
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePermissions = async (userId: string, modules: string[]) => {
    if (!tenantId) return false;
    setSaving(true);
    try {
      await supabase.from("user_permissions").delete().eq("user_id", userId).eq("tenant_id", tenantId);

      if (modules.length > 0) {
        const rows = modules.map((m) => ({ user_id: userId, tenant_id: tenantId, module: m }));
        const { error } = await supabase.from("user_permissions").insert(rows);
        if (error) throw error;
      }

      toast.success("Permissões atualizadas!");
      fetchUsers();
      return true;
    } catch (err: any) {
      toast.error("Erro ao atualizar permissões");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status: "approved" as any, tenant_id: tenantId })
        .eq("user_id", userId);
      
      if (profileError) throw profileError;

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (!existingRole || existingRole.length === 0) {
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "operador",
          tenant_id: tenantId,
        });
      }

      toast.success("Usuário aprovado com sucesso!");
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro ao aprovar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (userId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "rejected" as any })
        .eq("user_id", userId);
      
      if (error) throw error;

      toast.success("Usuário rejeitado.");
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro ao rejeitar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccess = async (userId: string, currentStatus: string) => {
    if (!tenantId) return;
    setSaving(true);
    const newStatus = currentStatus === "approved" ? "suspended" : "approved";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus as any })
        .eq("user_id", userId)
        .eq("tenant_id", tenantId);
      
      if (error) throw error;

      toast.success(newStatus === "approved" ? "Acesso liberado!" : "Acesso suspenso!");
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro ao alterar acesso do usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    } finally {
      setSaving(false);
    }
  };

  return {
    users,
    loading,
    saving,
    userLimit,
    isSuperAdmin,
    isAdminGabinete,
    isAuthorized,
    canDelete,
    canManageAccess,
    currentUser: user,
    actions: {
      handleCreateUser,
      handleUpdatePermissions,
      handleApprove,
      handleReject,
      handleToggleAccess,
      handleDeleteUser,
      refresh: fetchUsers
    }
  };
}
