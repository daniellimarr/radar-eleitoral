import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, UserPlus, Shield, Loader2 } from "lucide-react";

const AVAILABLE_MODULES = [
  { key: "dashboard", label: "Início / Dashboard" },
  { key: "contacts", label: "Cadastro de Contatos" },
  { key: "demands", label: "Demandas" },
  { key: "appointments", label: "Agenda" },
  { key: "leaders", label: "Lideranças" },
  { key: "vehicles", label: "Veículos" },
  { key: "materials", label: "Material de Campanha" },
  { key: "visit_requests", label: "Solicitações de Visita" },
  { key: "registration_links", label: "Links de Cadastro" },
  { key: "map", label: "Mapa / Georreferenciamento" },
  { key: "reports", label: "Relatórios" },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_gabinete: "Admin do Gabinete",
  coordenador: "Coordenador",
  assessor: "Assessor",
  operador: "Operador",
};

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  modules: string[];
}

export default function UserManagement() {
  const { tenantId } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("operador");
  const [newModules, setNewModules] = useState<string[]>([]);

  // Edit permissions state
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchUsers = async () => {
    if (!tenantId) return;
    setLoading(true);

    // Get profiles for this tenant
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("tenant_id", tenantId);

    if (!profiles || profiles.length === 0) { setUsers([]); setLoading(false); return; }

    const userIds = profiles.map((p) => p.user_id);

    // Get roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Get permissions
    const { data: permsData } = await supabase
      .from("user_permissions")
      .select("user_id, module")
      .eq("tenant_id", tenantId);

    const rolesMap = new Map<string, string>();
    rolesData?.forEach((r: any) => rolesMap.set(r.user_id, r.role));

    const permsMap = new Map<string, string[]>();
    permsData?.forEach((p: any) => {
      if (!permsMap.has(p.user_id)) permsMap.set(p.user_id, []);
      permsMap.get(p.user_id)!.push(p.module);
    });

    const rows: UserRow[] = profiles.map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: "", // we don't have email from profiles
      role: rolesMap.get(p.user_id) || null,
      modules: permsMap.get(p.user_id) || [],
    }));

    setUsers(rows);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [tenantId]);

  const handleCreate = async () => {
    if (!newEmail || !newName || !newPassword) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: newEmail, full_name: newName, password: newPassword, role: newRole, modules: newModules },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Usuário criado com sucesso!");
      setDialogOpen(false);
      setNewEmail(""); setNewName(""); setNewPassword(""); setNewRole("operador"); setNewModules([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    }
    setSaving(false);
  };

  const toggleModule = (mod: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(mod) ? list.filter((m) => m !== mod) : [...list, mod]);
  };

  const openEditPermissions = (user: UserRow) => {
    setEditUserId(user.user_id);
    setEditModules([...user.modules]);
    setEditDialogOpen(true);
  };

  const savePermissions = async () => {
    if (!editUserId || !tenantId) return;
    setSaving(true);

    // Delete existing then re-insert
    await supabase.from("user_permissions").delete().eq("user_id", editUserId).eq("tenant_id", tenantId);

    if (editModules.length > 0) {
      const rows = editModules.map((m) => ({ user_id: editUserId, tenant_id: tenantId, module: m }));
      await supabase.from("user_permissions").insert(rows);
    }

    toast.success("Permissões atualizadas!");
    setEditDialogOpen(false);
    setSaving(false);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Cadastre usuários e defina suas permissões de acesso</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome completo *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do usuário" />
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>Senha *</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <Label>Perfil / Cargo</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_gabinete">Admin do Gabinete</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="assessor">Assessor</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Módulos liberados</Label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_MODULES.map((mod) => (
                    <label key={mod.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={newModules.includes(mod.key)}
                        onCheckedChange={() => toggleModule(mod.key, newModules, setNewModules)}
                      />
                      <span className="text-sm">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Cadastrar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit permissions dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_MODULES.map((mod) => (
                <label key={mod.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={editModules.includes(mod.key)}
                    onCheckedChange={() => toggleModule(mod.key, editModules, setEditModules)}
                  />
                  <span className="text-sm">{mod.label}</span>
                </label>
              ))}
            </div>
            <Button onClick={savePermissions} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Permissões
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>
                      {u.role ? (
                        <Badge variant="secondary">{ROLE_LABELS[u.role] || u.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem perfil</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.modules.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Nenhum módulo</span>
                        ) : (
                          u.modules.map((m) => (
                            <Badge key={m} variant="outline" className="text-xs">
                              {AVAILABLE_MODULES.find((am) => am.key === m)?.label || m}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEditPermissions(u)}>
                        <Shield className="h-4 w-4 mr-1" /> Permissões
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
