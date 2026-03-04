import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, MessageSquare, Gift, Megaphone, Calendar as CalendarIcon, Target, TrendingUp, DollarSign, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import OperatorDashboard from "@/components/OperatorDashboard";

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
  const { tenantId, hasRole } = useAuth();
  const isOperador = hasRole("operador");
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

      const [contactRes, appointmentsRes, birthdayRes, engagementRes, allContactsRes, campaignRes, donationsRes, expensesRes] = await Promise.all([
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("start_time", todayStart).lte("start_time", todayEnd),
        supabase.from("contacts").select("birth_date").eq("tenant_id", tenantId).is("deleted_at", null).not("birth_date", "is", null),
        supabase.from("contacts").select("engagement, neighborhood").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("contacts").select("created_at").eq("tenant_id", tenantId).is("deleted_at", null),
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

  if (isOperador) {
    return <OperatorDashboard />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Início</h1>
        <div className="flex items-center gap-2 text-sm bg-foreground text-background px-4 py-2 rounded-lg font-medium">
          <CalendarIcon className="h-4 w-4" />
          {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Stat Cards */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => (
              <div key={card.label} className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-full ${card.bgColor} flex items-center justify-center shrink-0`}>
                  <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row: Visão Geral + Termômetro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Visão geral</CardTitle>
              <div className="flex gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="cadastros">
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cadastros">Cadastros</SelectItem>
                    <SelectItem value="atendimentos">Atendimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="cadastros" fill="hsl(220, 70%, 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Termômetro de envolvimento</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <span>Status</span>
              <span>Progresso</span>
            </div>
            {Object.entries(engagementLabels).map(([key, label]) => {
              const count = engagementData[key] || 0;
              const pct = Math.max((count / totalEngagement) * 100, 2);
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-44 shrink-0">{label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${engagementBarColors[key]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-bold border rounded-full px-3 py-0.5 ${engagementBadgeColors[key]}`}>
                    {count.toLocaleString()}
                  </span>
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
