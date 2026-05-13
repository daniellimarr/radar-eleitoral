import { useState, useCallback } from "react";
import { UserService } from "@/services/user-management/UserService";
import { UserDataMapper } from "@/services/user-management/UserDataMapper";
import { UserRow } from "@/types/user-management";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useUserActions(tenantId: string | null, fetchUsers: () => void) {
  const [saving, setSaving] = useState(false);

  const handleCreateUser = async (formData: any, currentActiveCount: number, userLimit: number) => {
    if (userLimit !== Infinity && currentActiveCount >= userLimit) {
      toast.error(`Limite de ${userLimit} usuários atingido. Faça upgrade do seu plano.`);
      return false;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", { body: formData });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      
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
      await UserService.clearPermissions(userId, tenantId);
      if (modules.length > 0) {
        const rows = modules.map(m => ({ user_id: userId, tenant_id: tenantId, module: m }));
        const { error } = await UserService.insertPermissions(rows);
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
      const { error } = await UserService.updateProfileStatus(userId, { 
        status: "approved", 
        tenant_id: tenantId 
      });
      if (error) throw error;

      const { data: existingRole } = await UserService.getRole(userId);
      if (!existingRole) {
        await UserService.insertRole(userId, "operador", tenantId);
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
      const { error } = await UserService.updateProfileStatus(userId, { status: "rejected" });
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
      const { error } = await UserService.updateProfileStatus(userId, { status: newStatus });
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
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleCreateUser,
    handleUpdatePermissions,
    handleApprove,
    handleReject,
    handleToggleAccess,
    handleDeleteUser
  };
}
