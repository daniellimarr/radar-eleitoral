import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, Plus } from "lucide-react";
import { ModulesSelector } from "./ModulesSelector";

interface CreateUserDialogProps {
  disabled: boolean;
  onSave: (data: any) => Promise<boolean>;
  saving: boolean;
  availableRoles: { value: string; label: string }[];
}

export function CreateUserDialog({ disabled, onSave, saving, availableRoles }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "operador",
    modules: [] as string[],
  });

  const handleSubmit = async () => {
    const success = await onSave(formData);
    if (success) {
      setOpen(false);
      setFormData({ email: "", full_name: "", password: "", role: "operador", modules: [] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <UserPlus className="h-4 w-4 mr-2" /> {disabled ? "Limite atingido" : "Novo Usuário"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input 
              value={formData.full_name} 
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))} 
              placeholder="Nome do usuário" 
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
              placeholder="email@exemplo.com" 
            />
          </div>
          <div className="space-y-2">
            <Label>Senha *</Label>
            <Input 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} 
              placeholder="Mínimo 6 caracteres" 
            />
          </div>
          <div className="space-y-2">
            <Label>Perfil / Cargo</Label>
            <Select 
              value={formData.role} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="mb-2 block">Módulos liberados</Label>
            <ModulesSelector 
              selectedModules={formData.modules} 
              onChange={(modules) => setFormData(prev => ({ ...prev, modules }))} 
            />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Cadastrar Usuário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
