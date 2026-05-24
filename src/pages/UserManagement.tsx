import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCheck, UserX, Clock } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserTable } from "@/components/user-management/UserTable";
import { CreateUserDialog } from "@/components/user-management/CreateUserDialog";
import { EditPermissionsDialog } from "@/components/user-management/EditPermissionsDialog";
import { UserRow } from "@/types/user-management";

export default function UserManagement() {
  const { 
    users, 
    loading, 
    saving, 
    userLimit, 
    isSuperAdmin, 
    isAuthorized, 
    canDelete, 
    canManageAccess, 
    currentUser,
    actions 
  } = useUserManagement();

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const pendingUsers = useMemo(() => users.filter((u) => u.status === "pending"), [users]);
  const activeUsers = useMemo(() => users.filter((u) => u.status === "approved"), [users]);
  const suspendedUsers = useMemo(() => users.filter((u) => u.status === "suspended"), [users]);
  
  const hasReachedUserLimit = false;

  const availableRoles = useMemo(() => {
    const roles = [
      { value: "coordenador", label: "Coordenador" },
      { value: "assessor", label: "Assessor" },
      { value: "operador", label: "Liderança" },
    ];
    if (isSuperAdmin) {
      roles.unshift({ value: "admin_gabinete", label: "Admin do Gabinete" });
    }
    return roles;
  }, [isSuperAdmin]);

  const openEditPermissions = (user: UserRow) => {
    setEditUser(user);
    setEditDialogOpen(true);
  };

  if (!isAuthorized) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Cadastre usuários e defina suas permissões de acesso

          </p>
        </div>

        <CreateUserDialog 
          disabled={hasReachedUserLimit} 
          onSave={actions.handleCreateUser} 
          saving={saving}
          availableRoles={availableRoles}
        />
      </div>

      <EditPermissionsDialog 
        user={editUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={actions.handleUpdatePermissions}
        saving={saving}
      />

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Card className="border-warning/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Clock className="h-5 w-5" />
              Cadastros Pendentes ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserTable 
              users={pendingUsers}
              canDelete={canDelete}
              canManageAccess={canManageAccess}
              saving={saving}
              onEditPermissions={openEditPermissions}
              onApprove={actions.handleApprove}
              onReject={actions.handleReject}
              onToggleAccess={actions.handleToggleAccess}
              onDelete={actions.handleDeleteUser}
            />
          </CardContent>
        </Card>
      )}

      {/* Active Users */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-500" />
            Usuários Ativos ({activeUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <UserTable 
              users={activeUsers}
              currentUserId={currentUser?.id}
              canDelete={canDelete}
              canManageAccess={canManageAccess}
              saving={saving}
              onEditPermissions={openEditPermissions}
              onApprove={actions.handleApprove}
              onReject={actions.handleReject}
              onToggleAccess={actions.handleToggleAccess}
              onDelete={actions.handleDeleteUser}
              emptyMessage="Nenhum usuário ativo"
            />
          )}
        </CardContent>
      </Card>

      {/* Suspended Users */}
      {suspendedUsers.length > 0 && (
        <Card className="border-amber-300/50 shadow-sm bg-amber-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <UserX className="h-5 w-5" />
              Usuários Suspensos ({suspendedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserTable 
              users={suspendedUsers}
              currentUserId={currentUser?.id}
              canDelete={canDelete}
              canManageAccess={canManageAccess}
              saving={saving}
              onEditPermissions={openEditPermissions}
              onApprove={actions.handleApprove}
              onReject={actions.handleReject}
              onToggleAccess={actions.handleToggleAccess}
              onDelete={actions.handleDeleteUser}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
