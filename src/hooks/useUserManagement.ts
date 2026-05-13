import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserList } from "./user-management/useUserList";
import { useUserActions } from "./user-management/useUserActions";

export function useUserManagement() {
  const { tenantId, user, roles, hasRole } = useAuth();
  const { userLimit } = useSubscription();
  
  const { users, loading, fetchUsers } = useUserList(tenantId);
  const userActions = useUserActions(tenantId, fetchUsers);

  const isSuperAdmin = hasRole('super_admin');
  const isAdminGabinete = hasRole('admin_gabinete');
  const isAuthorized = isSuperAdmin || isAdminGabinete || hasRole('coordenador');
  
  // RBAC permissions
  const canDelete = isAuthorized;
  const canManageAccess = isAuthorized;

  return {
    users,
    loading,
    saving: userActions.saving,
    userLimit,
    isSuperAdmin,
    isAdminGabinete,
    isAuthorized,
    canDelete,
    canManageAccess,
    currentUser: user,
    actions: {
      handleCreateUser: (formData: any) => 
        userActions.handleCreateUser(formData, users.filter(u => u.status === "approved").length, userLimit),
      handleUpdatePermissions: userActions.handleUpdatePermissions,
      handleApprove: userActions.handleApprove,
      handleReject: userActions.handleReject,
      handleToggleAccess: userActions.handleToggleAccess,
      handleDeleteUser: userActions.handleDeleteUser,
      refresh: fetchUsers
    }
  };
}
