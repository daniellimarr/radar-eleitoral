import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, CheckCircle, XCircle, Trash2, UserX } from "lucide-react";
import { UserRow, ROLE_LABELS, AVAILABLE_MODULES } from "@/types/user-management";

interface UserTableRowProps {
  user: UserRow;
  currentUserId?: string;
  canManageAccess: boolean;
  canDelete: boolean;
  saving: boolean;
  onEditPermissions: (user: UserRow) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleAccess: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function UserTableRow({ 
  user, 
  currentUserId, 
  canManageAccess, 
  canDelete, 
  saving,
  onEditPermissions,
  onApprove,
  onReject,
  onToggleAccess,
  onDelete
}: UserTableRowProps) {
  const isPending = user.status === "pending";
  const isSuspended = user.status === "suspended";
  const isSelf = user.user_id === currentUserId;

  return (
    <TableRow>
      <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
      <TableCell>
        {user.role ? (
          <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Sem perfil</span>
        )}
      </TableCell>
      <TableCell>
        {isPending ? (
          <Badge variant="outline" className="text-warning border-warning">Pendente</Badge>
        ) : (
          <div className="flex flex-wrap gap-1">
            {user.modules.length === 0 ? (
              <span className="text-xs text-muted-foreground">Nenhum módulo selecionado</span>
            ) : (
              user.modules.map((m) => (
                <Badge key={m} variant="outline" className="text-xs">
                  {AVAILABLE_MODULES.find((am) => am.key === m)?.label || m}
                </Badge>
              ))
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="outline" onClick={() => onEditPermissions(user)} disabled={saving}>
            <Shield className="h-4 w-4 mr-1" /> Permissões
          </Button>

          {isPending ? (
            <>
              <Button size="sm" variant="default" onClick={() => onApprove(user.user_id)} disabled={saving}>
                <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(user.user_id)} disabled={saving}>
                <XCircle className="h-4 w-4 mr-1" /> Rejeitar
              </Button>
            </>
          ) : (
            <>
              {canManageAccess && !isSelf && (
                <Button
                  size="sm"
                  variant="outline"
                  className={`${isSuspended ? 'text-emerald-600 border-emerald-300 hover:bg-emerald-50' : 'text-amber-600 border-amber-300 hover:bg-amber-50'}`}
                  onClick={() => onToggleAccess(user.user_id, user.status)}
                  disabled={saving}
                  title={isSuspended ? "Reativar acesso" : "Suspender acesso"}
                >
                  {isSuspended ? <CheckCircle className="h-4 w-4 mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
                  {isSuspended ? "Reativar" : "Suspender"}
                </Button>
              )}
              {canDelete && !isSelf && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={saving}>
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é irreversível. O usuário <strong>{user.full_name || "—"}</strong> será removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(user.user_id)}>
                        Confirmar exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
