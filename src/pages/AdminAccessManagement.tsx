import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { KeyRound, ShieldCheck, ShieldX, Clock, Loader2, Search, RefreshCw, Copy } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  monthly_price: number;
  is_active: boolean;
}

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_status: string | null;
  profile_status: string;
  sub_id: string | null;
  sub_plan: string | null;
  sub_status: string | null;
  expires_at: string | null;
  access_status: "ativo" | "pendente" | "expirado" | "revogado";
}

const ACCESS_BADGE: Record<Row["access_status"], string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  expirado: "bg-red-100 text-red-700",
  revogado: "bg-muted text-muted-foreground",
};

function computeAccess(r: Omit<Row, "access_status">): Row["access_status"] {
  if (r.sub_status === "cancelled") return "revogado";
  if (r.sub_status === "expired") return "expirado";
  if (r.sub_status === "active" && r.tenant_status === "ativo") {
    if (r.expires_at && new Date(r.expires_at) < new Date()) return "expirado";
    return "ativo";
  }
  return "pendente";
}

export default function AdminAccessManagement() {
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole("super_admin");

  const [rows, setRows] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<Row | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Row | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, subsRes, tenantsRes, plansRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, tenant_id, status").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("id, user_id, tenant_id, plan_name, status, expires_at").order("started_at", { ascending: false }),
      supabase.from("tenants").select("id, name, status").is("deleted_at", null),
      supabase.from("plans").select("id, name, duration_days, monthly_price, is_active").eq("is_active", true).order("monthly_price"),
    ]);

    const tenantsMap = new Map((tenantsRes.data || []).map((t: any) => [t.id, t]));
    const subsByUser = new Map<string, any>();
    (subsRes.data || []).forEach((s: any) => {
      if (!subsByUser.has(s.user_id)) subsByUser.set(s.user_id, s);
    });

    const out: Row[] = (profilesRes.data || []).map((p: any) => {
      const sub = subsByUser.get(p.user_id);
      const tenant = p.tenant_id ? tenantsMap.get(p.tenant_id) : null;
      const partial = {
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        tenant_id: p.tenant_id,
        tenant_name: (tenant as any)?.name ?? null,
        tenant_status: (tenant as any)?.status ?? null,
        profile_status: p.status,
        sub_id: sub?.id ?? null,
        sub_plan: sub?.plan_name ?? null,
        sub_status: sub?.status ?? null,
        expires_at: sub?.expires_at ?? null,
      };
      return { ...partial, access_status: computeAccess(partial) };
    });

    setRows(out);
    setPlans(plansRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const openLiberar = (r: Row) => {
    setTarget(r);
    setSelectedPlanId(plans[0]?.id ?? "");
    const days = plans[0]?.duration_days ?? 30;
    setExpiresAt(format(new Date(Date.now() + days * 86400_000), "yyyy-MM-dd"));
    setDialogOpen(true);
  };

  const onPlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const p = plans.find((x) => x.id === planId);
    if (p) {
      setExpiresAt(format(new Date(Date.now() + p.duration_days * 86400_000), "yyyy-MM-dd"));
    }
  };

  const handleLiberar = async () => {
    if (!target) return;
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) {
      toast({ title: "Selecione um plano", variant: "destructive" });
      return;
    }
    if (!expiresAt) {
      toast({ title: "Defina a data de expiração", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let tenantId = target.tenant_id;

      // Ensure a tenant exists
      if (!tenantId) {
        const { data: newTenant, error: tErr } = await supabase
          .from("tenants")
          .insert({
            name: target.full_name || target.email || "Gabinete",
            status: "ativo",
            plan_id: plan.id,
            contact_limit: 10000,
          })
          .select("id")
          .single();
        if (tErr) throw tErr;
        tenantId = newTenant.id;

        await supabase.from("profiles").update({ tenant_id: tenantId, status: "approved" }).eq("user_id", target.user_id);
        await supabase.from("user_roles").upsert(
          { user_id: target.user_id, role: "admin_gabinete", tenant_id: tenantId } as any,
          { onConflict: "user_id,role,tenant_id" as any }
        );
      } else {
        await supabase
          .from("tenants")
          .update({ status: "ativo", plan_id: plan.id })
          .eq("id", tenantId);
        await supabase.from("profiles").update({ status: "approved" }).eq("user_id", target.user_id);
      }

      const expiresIso = new Date(`${expiresAt}T23:59:59`).toISOString();

      // Cancel other active subs for this tenant
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (target.sub_id) {
        await supabase
          .from("subscriptions")
          .update({
            plan_name: plan.name,
            status: "active",
            expires_at: expiresIso,
            cancelled_at: null,
            next_due_date: expiresAt,
          })
          .eq("id", target.sub_id);
      } else {
        await supabase.from("subscriptions").insert({
          tenant_id: tenantId!,
          user_id: target.user_id,
          plan_name: plan.name,
          status: "active",
          expires_at: expiresIso,
          next_due_date: expiresAt,
        });
      }

      toast({ title: "Acesso liberado com sucesso" });
      setDialogOpen(false);
      setTarget(null);
      await fetchData();
    } catch (e: any) {
      toast({ title: "Erro ao liberar acesso", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRevogar = async (r: Row) => {
    if (!confirm(`Revogar acesso de ${r.full_name || r.email}?`)) return;
    try {
      if (r.sub_id) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", r.sub_id);
      }
      if (r.tenant_id) {
        await supabase.from("tenants").update({ status: "suspenso" }).eq("id", r.tenant_id);
      }
      toast({ title: "Acesso revogado" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Erro ao revogar", description: e.message, variant: "destructive" });
    }
  };

  const openResetPassword = (r: Row) => {
    setResetTarget(r);
    setTempPassword(null);
    setResetOpen(true);
  };

  const handleGenerateTempPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-temp-password", {
        body: { user_id: resetTarget.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTempPassword(data.temp_password);
      toast({ title: "Senha temporária gerada", description: "Compartilhe com o usuário de forma segura." });
    } catch (e: any) {
      toast({ title: "Erro ao gerar senha", description: e.message, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const copyTempPassword = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    toast({ title: "Senha copiada" });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.full_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.tenant_name?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const counts = {
    total: rows.length,
    ativo: rows.filter((r) => r.access_status === "ativo").length,
    pendente: rows.filter((r) => r.access_status === "pendente").length,
    expirado: rows.filter((r) => r.access_status === "expirado").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <KeyRound className="h-8 w-8 text-primary" />
          Liberação de Acesso
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aprove usuários manualmente, defina o plano e a data de expiração do acesso.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{counts.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-bold text-emerald-600">{counts.ativo}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-amber-600">{counts.pendente}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expirados</p><p className="text-2xl font-bold text-red-600">{counts.expirado}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>Usuários</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Gabinete</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.tenant_name || <span className="text-muted-foreground italic">Sem gabinete</span>}</TableCell>
                    <TableCell className="text-sm">{r.sub_plan || "—"}</TableCell>
                    <TableCell><Badge className={ACCESS_BADGE[r.access_status]}>{r.access_status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.expires_at ? format(new Date(r.expires_at), "dd/MM/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="default" onClick={() => openLiberar(r)}>
                        {r.access_status === "ativo" ? <><Clock className="h-3.5 w-3.5 mr-1" />Editar</> : <><ShieldCheck className="h-3.5 w-3.5 mr-1" />Liberar</>}
                      </Button>
                      {(r.access_status === "ativo" || r.access_status === "expirado") && (
                        <Button size="sm" variant="outline" onClick={() => handleRevogar(r)}>
                          <ShieldX className="h-3.5 w-3.5 mr-1" />Revogar
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => openResetPassword(r)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />Resetar senha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Liberar acesso</DialogTitle>
            <DialogDescription>
              {target?.full_name || target?.email} — defina o plano e o prazo de validade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plano de assinatura</Label>
              <Select value={selectedPlanId} onValueChange={onPlanChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — R$ {p.monthly_price.toFixed(2)} ({p.duration_days} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de expiração</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleLiberar} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Liberar acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={(o) => { setResetOpen(o); if (!o) setTempPassword(null); }}>
        <DialogContent onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Resetar senha do gabinete</DialogTitle>
            <DialogDescription>
              {resetTarget?.full_name || resetTarget?.email} — uma senha temporária será gerada. No próximo login o usuário será obrigado a criar uma nova senha permanente.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-3 py-2">
              <Label>Senha temporária</Label>
              <div className="flex gap-2">
                <Input readOnly value={tempPassword} className="font-mono" />
                <Button type="button" variant="outline" onClick={copyTempPassword}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copie e envie ao usuário por um canal seguro. Esta senha não será exibida novamente.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              Ao confirmar, uma nova senha temporária será criada e a senha atual será invalidada.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={resetLoading}>
              {tempPassword ? "Fechar" : "Cancelar"}
            </Button>
            {!tempPassword && (
              <Button onClick={handleGenerateTempPassword} disabled={resetLoading}>
                {resetLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</> : "Gerar senha temporária"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
