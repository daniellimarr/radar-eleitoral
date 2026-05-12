import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ModulesSelector } from "./ModulesSelector";
import { UserRow } from "@/types/user-management";

interface EditPermissionsDialogProps {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, modules: string[]) => Promise<boolean>;
  saving: boolean;
}

export function EditPermissionsDialog({ user, open, onOpenChange, onSave, saving }: EditPermissionsDialogProps) {
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setModules([...user.modules]);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const success = await onSave(user.user_id, modules);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Permissões: {user?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <ModulesSelector selectedModules={modules} onChange={setModules} />
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar Permissões
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
