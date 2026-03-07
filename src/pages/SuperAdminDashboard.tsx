import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Package, Users, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface TenantStats {
  id: string;
  name: string;
  status: string;
  plan_name: string | null;
  contact_limit: number;
  created_at: string;
}

interface SubscriptionInfo {
  id: string;
  tenant_id: string;
  user_id: string;
  plan_name: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  tenant_name?: string;
  user_email?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  suspenso: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
};

const PIE_COLORS = ["hsl(145, 65%, 42%)", "hsl(40, 90%, 55%)", "hsl(0, 70%, 55%)"];

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [tenantsRes, plansRes] = await Promise.all([
        supabase.from("tenants").select("id, name, status, plan_id, contact_limit, created_at").is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("plans").select("*").order("monthly_price"),
      ]);

      const plansData = plansRes.data || [];
      setPlans(plansData);

      const tenantsData = (tenantsRes.data || []).map((t: any) => ({
        ...t,
        plan_name: plansData.find((p: any) => p.id === t.plan_id)?.name || null,
      }));
      setTenants(tenantsData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === "ativo").length;
  const suspendedTenants = tenants.filter(t => t.status === "suspenso").length;
  const totalPlans = plans.filter(p => p.is_active).length;

  const mrr = tenants
    .filter(t => t.status === "ativo" && t.plan_name)
    .reduce((sum, t) => {
      const plan = plans.find(p => p.name === t.plan_name);
      return sum + (plan?.monthly_price || 0);
    }, 0);

  const statusDistribution = [
    { name: "Ativos", value: activeTenants },
    { name: "Suspensos", value: suspendedTenants },
    { name: "Cancelados", value: tenants.filter(t => t.status === "cancelado").length },
  ].filter(d => d.value > 0);

  const planDistribution = plans.filter(p => p.is_active).map(p => ({
    name: p.name,
    value: tenants.filter(t => t.plan_name === p.name && t.status === "ativo").length,
  })).filter(d => d.value > 0);

  // Monthly tenant creation
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthCounts = new Array(12).fill(0);
  tenants.forEach(t => {
    const month = new Date(t.created_at).getMonth();
    monthCounts[month]++;
  });
  const monthlyData = months.map((m, i) => ({ name: m, tenants: monthCounts[i] }));

  const statCards = [
    { label: "Total de Tenants", value: totalTenants, icon: Building2, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "Tenants Ativos", value: activeTenants, icon: Users, bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
    { label: "Planos Ativos", value: totalPlans, icon: Package, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
    { label: "MRR Estimado", value: `R$ ${mrr.toFixed(2)}`, icon: DollarSign, bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel da Plataforma</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema — {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full ${card.bgColor} flex items-center justify-center shrink-0`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Novos Tenants por Mês</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tenants" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} name="Tenants" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribuição por Status</CardTitle></CardHeader>
          <CardContent className="h-72">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {suspendedTenants > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-amber-800 font-medium">{suspendedTenants} tenant(s) suspenso(s) requerem atenção.</span>
          </CardContent>
        </Card>
      )}

      {/* Recent Tenants */}
      <Card>
        <CardHeader><CardTitle>Tenants Recentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Limite Contatos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : tenants.slice(0, 10).map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.plan_name || "—"}</TableCell>
                  <TableCell>{t.contact_limit.toLocaleString()}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[t.status] || ""}>{t.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(t.created_at), "dd/MM/yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
