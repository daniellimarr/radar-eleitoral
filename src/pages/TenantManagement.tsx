import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Building2, Loader2, Trash2, Ban, CheckCircle, KeyRound } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  document: string | null;
  status: string;
  contact_limit: number;
  created_at: string;
}

interface TenantAdmin {
  tenant_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
}

export default function TenantManagement() {
  const { hasRole } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<{ userId: string; tenantName: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({
    name: "", document: "", status: "ativo", contact_limit: "5000",
    admin_name: "", admin_email: "", admin_password: "",
  });

  const isSuperAdmin = hasRole("super_admin");

  const fetchData = async () => {
    setLoading(true);
    const { data: tenantsRes } = await supabase
      .from("tenants")
      .select("id, name, document, status, contact_limit, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    
    if (tenantsRes) setTenants(tenantsRes as Tenant[]);

    if (tenantsRes && tenantsRes.length > 0) {
      const tenantIds = tenantsRes.map(t => t.id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("tenant_id, user_id, full_name")
        .in("tenant_id", tenantIds);

      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.user_id);
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds)
          .eq("role", "admin_gabinete");

        const adminUserIds = new Set(roles?.map(r => r.user_id) || []);
        const admins: TenantAdmin[] = [];
        
        for (const profile of profiles) {
          if (adminUserIds.has(profile.user_id)) {
            admins.push({
              tenant_id: profile.tenant_id!,
              user_id: profile.user_id,
              email: "",
              full_name: profile.full_name,
            });
          }
        }

        const { data: emailData } = await supabase.functions.invoke("get-tenant-emails", {
          body: { user_ids: admins.map(a => a.user_id) },
        }).catch(() => ({ data: null }));

        if (emailData?.emails) {
          for (const admin of admins) {
            admin.email = emailData.emails[admin.user_id] || "";
          }
        }
        setTenantAdmins(admins);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingTenant(null);
    setForm({ name: "", document: "", status: "ativo", contact_limit: "5000", admin_name: "", admin_email: "", admin_password: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditingTenant(t);
    const admin = tenantAdmins.find(a => a.tenant_id === t.id);
    setForm({
      name: t.name,
      document: t.document || "",
      status: t.status,
      contact_limit: String(t.contact_limit),
      admin_name: admin?.full_name || "",
      admin_email: admin?.email || "",
      admin_password: "",
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
        contact_limit: parseInt(form.contact_limit) || 5000,
      };
      const { error } = await supabase.from("tenants").update(payload).eq("id", editingTenant.id);
      setSaving(false);
      if (error) { toast.error("Erro ao atualizar gabinete"); return; }
      toast.success("Gabinete atualizado!");
    } else {
      if (!form.admin_email || !form.admin_password || !form.admin_name) {
        toast.error("Preencha os dados do administrador");
        setSaving(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("onboard-tenant", {
        body: {
          tenant_name: form.name.trim(),
          tenant_document: form.document.trim(),
          contact_limit: form.contact_limit,
          admin_email: form.admin_email.trim(),
          admin_name: form.admin_name.trim(),
          admin_password: form.admin_password,
        },
      });
      setSaving(false);
      if (error) { toast.error("Erro ao criar gabinete"); return; }
      toast.success(data?.message || "Gabinete criado!");
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
      await supabase.from("tenants").update({ deleted_at: new Date().toISOString(), status: "cancelado" as any }).eq("id", deleteTarget.id);
      toast.success("Gabinete excluído!");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error("Erro ao excluir gabinete");
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordTarget || !newPassword) return;
    setChangingPassword(true);
    try {
      await supabase.functions.invoke("change-password", {
        body: { user_id: passwordTarget.userId, new_password: newPassword },
      });
      toast.success("Senha alterada!");
      setPasswordDialogOpen(false);
      setNewPassword("");
    } catch (err) {
      toast.error("Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!isSuperAdmin) return <div className="flex items-center justify-center h-64 text-muted-foreground">Acesso restrito.</div>;

  const getAdminEmail = (tenantId: string) => tenantAdmins.find(a => a.tenant_id === tenantId)?.email || "—";
  const getAdmin = (tenantId: string) => tenantAdmins.find(a => a.tenant_id === tenantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Gestão de Gabinetes</h1>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Gabinete</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email Admin</TableHead>
                <TableHead>Limite Contatos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : tenants.map(t => {
                const admin = getAdmin(t.id);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getAdminEmail(t.id)}</TableCell>
                    <TableCell>{t.contact_limit.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={t.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(t)} title="Editar"><Pencil className="h-3 w-3" /></Button>
                      {admin && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setPasswordTarget({ userId: admin.user_id, tenantName: t.name, email: admin.email });
                          setPasswordDialogOpen(true);
                        }} title="Senha"><KeyRound className="h-3 w-3" /></Button>
                      )}
                      <Button size="sm" variant={t.status === "ativo" ? "destructive" : "default"} onClick={() => toggleStatus(t)}>
                         {t.status === "ativo" ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                       </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTenant ? "Editar Gabinete" : "Novo Gabinete"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Gabinete *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Documento (CNPJ/CPF)</Label>
              <Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Limite de Contatos</Label>
              <Input type="number" value={form.contact_limit} onChange={e => setForm(f => ({ ...f, contact_limit: e.target.value }))} />
            </div>
            
            {!editingTenant && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Nome do Administrador *</Label>
                  <Input value={form.admin_name} onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Administrador *</Label>
                  <Input type="email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Senha Temporária *</Label>
                  <Input type="password" value={form.admin_password} onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))} />
                </div>
              </>
            )}
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Gabinete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar Senha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Usuário: {passwordTarget?.email}</p>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gabinete?</AlertDialogTitle>
            <AlertDialogDescription>Iso removerá permanentemente o gabinete "{deleteTarget?.name}" e todos os seus usuários.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
