import { useEffect, useState, useMemo, memo, Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MessageSquare, Gift, Megaphone, Calendar as CalendarIcon, Target, TrendingUp, DollarSign, MapPin, Crown, ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Otimização: Lazy load de dashboards secundários
const OperatorDashboard = lazy(() => import("@/components/OperatorDashboard"));
const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdminDashboard"));

const engagementLabels: Record<string, string> = {
  nao_trabalhado: "Não trabalhado",
  em_prospeccao: "Em prospecção",
  conquistado: "Conquistado",
  criando_envolvimento: "Criando envolvimento",
  falta_trabalhar: "Falta trabalhar",
  envolvimento_perdido: "Envolvimento Perdido",
};

const engagementBarColors: Record<string, string> = {
  nao_trabalhado: "bg-info",
  em_prospeccao: "bg-success",
  conquistado: "bg-purple-400",
  criando_envolvimento: "bg-warning",
  falta_trabalhar: "bg-muted-foreground",
  envolvimento_perdido: "bg-destructive",
};

const engagementBadgeColors: Record<string, string> = {
  nao_trabalhado: "border-info text-info",
  em_prospeccao: "border-success text-success",
  conquistado: "border-purple-400 text-purple-500",
  criando_envolvimento: "border-warning text-warning",
  falta_trabalhar: "border-muted-foreground text-muted-foreground",
  envolvimento_perdido: "border-destructive text-destructive",
};

const engagementWeight: Record<string, number> = {
  conquistado: 0.9,
  criando_envolvimento: 0.6,
  em_prospeccao: 0.3,
  nao_trabalhado: 0.1,
  falta_trabalhar: 0.15,
  envolvimento_perdido: 0.05,
};

export default function Dashboard() {
  const { tenantId, hasRole, loading, roles } = useAuth();
  const { planName, contactLimit, userLimit, subscriptionEnd } = useSubscription();
  const navigate = useNavigate();
  const isOperador = hasRole("operador");
  const isSuperAdmin = hasRole("super_admin");
  const isAdminRole = isSuperAdmin || hasRole("admin_gabinete");
  const [stats, setStats] = useState({ contacts: 0, appointmentsToday: 0, birthdays: 0, citizenParticipates: 0 });
  const [engagementData, setEngagementData] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [projectedVotes, setProjectedVotes] = useState(0);
  const [financialSummary, setFinancialSummary] = useState({ donations: 0, expenses: 0 });
  const [neighborhoodData, setNeighborhoodData] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (!tenantId || isOperador) return;

    const fetchStats = async () => {
      const now = new Date();
      const todayStart = format(now, "yyyy-MM-dd") + "T00:00:00";
      const todayEnd = format(now, "yyyy-MM-dd") + "T23:59:59";

      // Otimização: Promise.all para chamadas paralelas
      const [contactRes, appointmentsRes, birthdayRes, engagementRes, allContactsRes, campaignRes, donationsRes, expensesRes] = await Promise.all([
        supabase.from("contacts_decrypted").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("start_time", todayStart).lte("start_time", todayEnd),
        supabase.from("contacts_decrypted").select("birth_date").eq("tenant_id", tenantId).is("deleted_at", null).not("birth_date", "is", null),
        supabase.from("contacts_decrypted").select("engagement, neighborhood").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("contacts_decrypted").select("created_at").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("campaigns").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1),
        supabase.from("donations").select("valor").eq("tenant_id", tenantId),
        supabase.from("expenses").select("valor").eq("tenant_id", tenantId),
      ]);

      // Birthdays
      const todayMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const birthdayCount = (birthdayRes.data || []).filter((c: any) => {
        const [, month, day] = c.birth_date.split("-");
        return `${month}-${day}` === todayMMDD;
      }).length;

      // Engagement
      const contacts = engagementRes.data || [];
      const engagement: Record<string, number> = {};
      let projVotes = 0;
      const neighborhoodMap: Record<string, number> = {};

      contacts.forEach((c: any) => {
        const e = c.engagement || "nao_trabalhado";
        engagement[e] = (engagement[e] || 0) + 1;
        projVotes += engagementWeight[e] || 0;
        if (c.neighborhood) {
          neighborhoodMap[c.neighborhood] = (neighborhoodMap[c.neighborhood] || 0) + 1;
        }
      });

      setEngagementData(engagement);
      setProjectedVotes(Math.round(projVotes));
      setNeighborhoodData(
        Object.entries(neighborhoodMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }))
      );

      if (campaignRes.data && campaignRes.data.length > 0) setCampaign(campaignRes.data[0]);

      const totalDonations = (donationsRes.data || []).reduce((s: number, d: any) => s + Number(d.valor), 0);
      const totalExpenses = (expensesRes.data || []).reduce((s: number, e: any) => s + Number(e.valor), 0);
      setFinancialSummary({ donations: totalDonations, expenses: totalExpenses });

      setStats({
        contacts: contactRes.count || 0,
        appointmentsToday: appointmentsRes.count || 0,
        birthdays: birthdayCount,
        citizenParticipates: 0,
      });

      // Monthly chart
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthCounts = new Array(12).fill(0);
      (allContactsRes.data || []).forEach((c: any) => { monthCounts[new Date(c.created_at).getMonth()]++; });
      setMonthlyData(months.map((m, i) => ({ name: m, cadastros: monthCounts[i] })));
    };

    fetchStats();
  }, [tenantId, isOperador]);

  // Wait for auth/roles to load before deciding which dashboard to show
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <Suspense fallback={<div className="flex h-64 items-center justify-center text-muted-foreground">Carregando Painel Super Admin...</div>}>
        <SuperAdminDashboard />
      </Suspense>
    );
  }

  if (isOperador) {
    return (
      <Suspense fallback={<div className="flex h-64 items-center justify-center text-muted-foreground">Carregando Painel Operador...</div>}>
        <OperatorDashboard />
      </Suspense>
    );
  }

  const totalEngagement = Object.values(engagementData).reduce((a, b) => a + b, 0) || 1;
  const metaVotos = campaign?.meta_votos || 0;
  const projPct = metaVotos > 0 ? Math.min((projectedVotes / metaVotos) * 100, 100) : 0;

  const statCards = [
    { label: "Contatos", value: stats.contacts, icon: Users, bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
    { label: "Atendimentos hoje", value: stats.appointmentsToday, icon: MessageSquare, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "Aniversariantes hoje", value: stats.birthdays, icon: Gift, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
    { label: "Cidadão participa", value: stats.citizenParticipates, icon: Megaphone, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel Geral</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho da sua campanha em tempo real.</p>
        </div>
        <div className="flex items-center gap-3 bg-card border px-4 py-2.5 rounded-xl shadow-sm">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={card.label} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0">
              <div className="p-6 flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl ${card.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className="text-3xl font-bold tracking-tight mt-1">{card.value.toLocaleString()}</p>
                </div>
              </div>
              <div className={`h-1 w-full ${card.bgColor.replace('100', '500')} opacity-20`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row: Visão Geral + Termômetro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Crescimento da Base</CardTitle>
                <p className="text-sm text-muted-foreground">Cadastros realizados por mês</p>
              </div>
              <div className="flex gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-24 h-9 bg-muted/50 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="cadastros" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Termômetro de Envolvimento</CardTitle>
            <p className="text-sm text-muted-foreground">Nível de engajamento da sua base</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b pb-3">
              <span>Status de Engajamento</span>
              <span>Total</span>
            </div>
            {Object.entries(engagementLabels).map(([key, label]) => {
              const count = engagementData[key] || 0;
              const pct = Math.max((count / totalEngagement) * 100, 2);
              return (
                <div key={key} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground/80">{label}</span>
                    <Badge variant="outline" className={`font-mono font-bold transition-colors ${engagementBadgeColors[key]}`}>
                      {count.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${engagementBarColors[key]}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Vote Projection */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Projeção de Votos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {campaign ? (
            <>
              <div className="flex justify-between text-sm">
                <span>Campanha: <strong>{campaign.nome_campanha}</strong></span>
                <span>{campaign.cargo} - {campaign.partido} {campaign.numero}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Projeção estimada</span>
                  <span className="font-bold">{projectedVotes.toLocaleString()} / {metaVotos.toLocaleString()}</span>
                </div>
                <Progress value={projPct} className="h-3" />
                <p className="text-xs text-muted-foreground text-right">{projPct.toFixed(1)}% da meta</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhuma campanha cadastrada.</p>
          )}
        </CardContent>
      </Card>

      {/* Neighborhood ranking */}
      {neighborhoodData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Top 10 Bairros por Apoiadores</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={neighborhoodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={11} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(145, 65%, 42%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
