import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Package } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  contact_limit: number;
  user_limit: number;
  has_premium_modules: boolean;
  is_active: boolean;
}

export default function PlanManagement() {
  const { hasRole } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: "", monthly_price: "0", contact_limit: "1000", user_limit: "5", has_premium_modules: false, is_active: true });

  const isSuperAdmin = hasRole("super_admin");

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from("plans").select("*").order("monthly_price");
    if (data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", monthly_price: "0", contact_limit: "1000", user_limit: "5", has_premium_modules: false, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      monthly_price: String(p.monthly_price),
      contact_limit: String(p.contact_limit),
      user_limit: String(p.user_limit),
      has_premium_modules: p.has_premium_modules,
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const payload = {
      name: form.name.trim(),
      monthly_price: parseFloat(form.monthly_price) || 0,
      contact_limit: parseInt(form.contact_limit) || 1000,
      user_limit: parseInt(form.user_limit) || 5,
      has_premium_modules: form.has_premium_modules,
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from("plans").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar plano"); return; }
      toast.success("Plano atualizado!");
    } else {
      const { error } = await supabase.from("plans").insert(payload);
      if (error) { toast.error("Erro ao criar plano: " + error.message); return; }
      toast.success("Plano criado!");
    }
    setDialogOpen(false);
    fetchPlans();
  };

  if (!isSuperAdmin) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Acesso restrito a Super Admins.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Gestão de Planos</h1>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Limite Contatos</TableHead>
                <TableHead>Limite Usuários</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : plans.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum plano cadastrado.</TableCell></TableRow>
              ) : plans.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>R$ {Number(p.monthly_price).toFixed(2)}</TableCell>
                  <TableCell>{p.contact_limit.toLocaleString()}</TableCell>
                  <TableCell>{p.user_limit}</TableCell>
                  <TableCell>{p.has_premium_modules ? <Badge className="bg-purple-100 text-purple-700">Sim</Badge> : "Não"}</TableCell>
                  <TableCell>{p.is_active ? <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Preço Mensal (R$)</Label><Input type="number" step="0.01" value={form.monthly_price} onChange={e => setForm(f => ({ ...f, monthly_price: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Limite de Contatos</Label><Input type="number" value={form.contact_limit} onChange={e => setForm(f => ({ ...f, contact_limit: e.target.value }))} /></div>
              <div><Label>Limite de Usuários</Label><Input type="number" value={form.user_limit} onChange={e => setForm(f => ({ ...f, user_limit: e.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Módulos Premium</Label>
              <Switch checked={form.has_premium_modules} onCheckedChange={v => setForm(f => ({ ...f, has_premium_modules: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Salvar" : "Criar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
