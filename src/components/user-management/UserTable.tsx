import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRow } from "@/types/user-management";
import { UserTableRow } from "./UserTableRow";

interface UserTableProps {
  users: UserRow[];
  currentUserId?: string;
  canManageAccess: boolean;
  canDelete: boolean;
  saving: boolean;
  onEditPermissions: (user: UserRow) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleAccess: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}

export function UserTable({ 
  users, 
  currentUserId, 
  canManageAccess, 
  canDelete, 
  saving,
  onEditPermissions,
  onApprove,
  onReject,
  onToggleAccess,
  onDelete,
  emptyMessage = "Nenhum usuário encontrado"
}: UserTableProps) {
  if (users.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead>Módulos / Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <UserTableRow 
            key={u.user_id} 
            user={u} 
            currentUserId={currentUserId}
            canManageAccess={canManageAccess}
            canDelete={canDelete}
            saving={saving}
            onEditPermissions={onEditPermissions}
            onApprove={onApprove}
            onReject={onReject}
            onToggleAccess={onToggleAccess}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
