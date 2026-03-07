import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Shield, Users, Building2, Mail, Loader2, Trash2, Ban, CheckCircle } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  document: string | null;
  status: string;
  contact_limit: number;
  plan_id: string | null;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  contact_limit: number;
  user_limit: number;
}

export default function TenantManagement() {
  const { hasRole } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: "", document: "", status: "ativo", plan_id: "", contact_limit: "1000",
    admin_name: "", admin_email: "", admin_password: "",
  });

  const isSuperAdmin = hasRole("super_admin");

  const fetchData = async () => {
    setLoading(true);
    const [tenantsRes, plansRes] = await Promise.all([
      supabase.from("tenants").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("plans").select("*").eq("is_active", true),
    ]);
    if (tenantsRes.data) setTenants(tenantsRes.data);
    if (plansRes.data) setPlans(plansRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingTenant(null);
    setForm({ name: "", document: "", status: "ativo", plan_id: "", contact_limit: "1000", admin_name: "", admin_email: "", admin_password: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditingTenant(t);
    setForm({
      name: t.name,
      document: t.document || "",
      status: t.status,
      plan_id: t.plan_id || "",
      contact_limit: String(t.contact_limit),
      admin_name: "", admin_email: "", admin_password: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }

    setSaving(true);

    if (editingTenant) {
      const payload = {
        name: form.name.trim(),
        document: form.document.trim() || null,
        status: form.status as any,
        plan_id: form.plan_id || null,
        contact_limit: parseInt(form.contact_limit) || 1000,
      };
      const { error } = await supabase.from("tenants").update(payload).eq("id", editingTenant.id);
      setSaving(false);
      if (error) { toast.error("Erro ao atualizar gabinete"); return; }
      toast.success("Gabinete atualizado!");
    } else {
      if (!form.admin_email || !form.admin_password || !form.admin_name) {
        toast.error("Preencha os dados do administrador (nome, email e senha)");
        setSaving(false);
        return;
      }
      if (form.admin_password.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres");
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("onboard-tenant", {
        body: {
          tenant_name: form.name.trim(),
          tenant_document: form.document.trim(),
          plan_id: form.plan_id || null,
          contact_limit: form.contact_limit,
          admin_email: form.admin_email.trim(),
          admin_name: form.admin_name.trim(),
          admin_password: form.admin_password,
        },
      });

      setSaving(false);

      if (error) { toast.error("Erro ao criar gabinete: " + error.message); return; }
      if (data?.error) { toast.error("Erro: " + data.error); return; }

      toast.success(data?.message || "Gabinete criado com sucesso!");
    }

    setDialogOpen(false);
    fetchData();
  };

  const toggleStatus = async (t: Tenant) => {
    const newStatus = t.status === "ativo" ? "suspenso" : "ativo";
    const { error } = await supabase.from("tenants").update({ status: newStatus as any }).eq("id", t.id);
    if (error) { toast.error("Erro ao alterar status"); return; }
    toast.success(`Gabinete ${newStatus === "ativo" ? "ativado" : "suspenso"}!`);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      // 1. Get all users from this tenant
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("tenant_id", deleteTarget.id);

      const userIds = profiles?.map(p => p.user_id) || [];

      // 2. Delete each user via edge function (removes auth + cascades)
      for (const userId of userIds) {
        await supabase.functions.invoke("delete-user", {
          body: { user_id: userId },
        });
      }

      // 3. Cancel active subscriptions
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("tenant_id", deleteTarget.id)
        .eq("status", "active");

      // 4. Soft-delete the tenant
      await supabase
        .from("tenants")
        .update({ deleted_at: new Date().toISOString(), status: "cancelado" as any })
        .eq("id", deleteTarget.id);

      toast.success("Gabinete excluído com sucesso! Todos os usuários foram removidos.");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error("Erro ao excluir gabinete:", err);
      toast.error("Erro ao excluir gabinete");
    } finally {
      setDeleting(false);
    }
  };

  if (!isSuperAdmin) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Acesso restrito a Super Admins.</div>;
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { ativo: "bg-emerald-100 text-emerald-700", suspenso: "bg-amber-100 text-amber-700", cancelado: "bg-red-100 text-red-700" };
    return <Badge className={map[status] || ""}>{status}</Badge>;
  };

  const getPlanName = (planId: string | null) => plans.find(p => p.id === planId)?.name || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Gestão de Gabinetes</h1>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Gabinete</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><Building2 className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{tenants.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-bold">{tenants.filter(t => t.status === "ativo").length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center"><Ban className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-sm text-muted-foreground">Suspensos</p><p className="text-2xl font-bold">{tenants.filter(t => t.status === "suspenso").length}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Limite Contatos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : tenants.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum gabinete cadastrado.</TableCell></TableRow>
              ) : tenants.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.document || "—"}</TableCell>
                  <TableCell>{getPlanName(t.plan_id)}</TableCell>
                  <TableCell>{t.contact_limit.toLocaleString()}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)} title="Editar">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant={t.status === "ativo" ? "destructive" : "default"} onClick={() => toggleStatus(t)} title={t.status === "ativo" ? "Suspender" : "Ativar"}>
                      {t.status === "ativo" ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(t)} title="Excluir gabinete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTenant ? "Editar Gabinete" : "Novo Gabinete + Administrador"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome do Gabinete *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Documento (CNPJ/CPF)</Label><Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} /></div>
            <div>
              <Label>Plano</Label>
              <Select value={form.plan_id} onValueChange={v => {
                const plan = plans.find(p => p.id === v);
                setForm(f => ({ ...f, plan_id: v, contact_limit: plan ? String(plan.contact_limit) : f.contact_limit }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — R$ {p.monthly_price}/mês</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Limite de Contatos</Label><Input type="number" value={form.contact_limit} onChange={e => setForm(f => ({ ...f, contact_limit: e.target.value }))} /></div>

            {editingTenant ? (
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Administrador do Gabinete
                </div>
                <div><Label>Nome Completo *</Label><Input value={form.admin_name} onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))} placeholder="Nome do administrador" /></div>
                <div><Label>Email *</Label><Input type="email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))} placeholder="admin@exemplo.com" /></div>
                <div><Label>Senha *</Label><Input type="password" value={form.admin_password} onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))} placeholder="Mínimo 6 caracteres" /></div>
              </>
            )}

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTenant ? "Salvar" : "Criar Gabinete e Administrador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gabinete</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o gabinete <strong>"{deleteTarget?.name}"</strong>?
              <br /><br />
              Esta ação irá:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Remover todos os usuários do gabinete</li>
                <li>Cancelar assinaturas ativas</li>
                <li>Desativar o acesso ao sistema</li>
              </ul>
              <br />
              <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir Gabinete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
