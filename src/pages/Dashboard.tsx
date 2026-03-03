import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, MessageSquare, Gift, Megaphone, Calendar as CalendarIcon, Target, TrendingUp, DollarSign, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const engagementLabels: Record<string, string> = {
  nao_trabalhado: "Não trabalhado",
  em_prospeccao: "Em prospecção",
  conquistado: "Conquistado",
  criando_envolvimento: "Criando envolvimento",
  falta_trabalhar: "Falta trabalhar",
  envolvimento_perdido: "Envolvimento perdido",
};

const engagementColors: Record<string, string> = {
  nao_trabalhado: "bg-primary",
  em_prospeccao: "bg-warning",
  conquistado: "bg-success",
  criando_envolvimento: "bg-info",
  falta_trabalhar: "bg-muted-foreground",
  envolvimento_perdido: "bg-destructive",
};

const engagementWeight: Record<string, number> = {
  conquistado: 0.9,
  criando_envolvimento: 0.6,
  em_prospeccao: 0.3,
  nao_trabalhado: 0.1,
  falta_trabalhar: 0.15,
  envolvimento_perdido: 0.05,
};

const PIE_COLORS = ["hsl(205, 85%, 50%)", "hsl(145, 65%, 42%)", "hsl(38, 95%, 55%)", "hsl(0, 72%, 55%)", "hsl(270, 60%, 55%)"];

export default function Dashboard() {
  const { tenantId } = useAuth();
  const [stats, setStats] = useState({ contacts: 0, demandsOpen: 0, birthdays: 0, strongSupporters: 0, undecided: 0 });
  const [engagementData, setEngagementData] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);
  const [projectedVotes, setProjectedVotes] = useState(0);
  const [neighborhoodData, setNeighborhoodData] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState({ donations: 0, expenses: 0 });

  useEffect(() => {
    if (!tenantId) return;

    const fetchStats = async () => {
      // Parallel fetches
      const [contactRes, demandsRes, birthdayRes, engagementRes, allContactsRes, campaignRes, donationsRes, expensesRes] = await Promise.all([
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("demands").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "aberta"),
        supabase.from("contacts").select("birth_date").eq("tenant_id", tenantId).is("deleted_at", null).not("birth_date", "is", null),
        supabase.from("contacts").select("engagement, neighborhood").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("contacts").select("created_at").eq("tenant_id", tenantId).is("deleted_at", null),
        supabase.from("campaigns").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1),
        supabase.from("donations").select("valor").eq("tenant_id", tenantId),
        supabase.from("expenses").select("valor").eq("tenant_id", tenantId),
      ]);

      // Birthdays
      const now = new Date();
      const todayMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const birthdayCount = (birthdayRes.data || []).filter((c: any) => {
        const [, month, day] = c.birth_date.split("-");
        return `${month}-${day}` === todayMMDD;
      }).length;

      // Engagement analysis
      const contacts = engagementRes.data || [];
      const engagement: Record<string, number> = {};
      let strong = 0, undecided = 0, projVotes = 0;
      const neighborhoodMap: Record<string, number> = {};

      contacts.forEach((c: any) => {
        const e = c.engagement || "nao_trabalhado";
        engagement[e] = (engagement[e] || 0) + 1;
        if (e === "conquistado" || e === "criando_envolvimento") strong++;
        if (e === "nao_trabalhado" || e === "em_prospeccao") undecided++;
        projVotes += engagementWeight[e] || 0;
        if (c.neighborhood) {
          neighborhoodMap[c.neighborhood] = (neighborhoodMap[c.neighborhood] || 0) + 1;
        }
      });

      setEngagementData(engagement);
      setProjectedVotes(Math.round(projVotes));
      setNeighborhoodData(
        Object.entries(neighborhoodMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value }))
      );

      // Campaign
      if (campaignRes.data && campaignRes.data.length > 0) setCampaign(campaignRes.data[0]);

      // Financial
      const totalDonations = (donationsRes.data || []).reduce((s: number, d: any) => s + Number(d.valor), 0);
      const totalExpenses = (expensesRes.data || []).reduce((s: number, e: any) => s + Number(e.valor), 0);
      setFinancialSummary({ donations: totalDonations, expenses: totalExpenses });

      setStats({
        contacts: contactRes.count || 0,
        demandsOpen: demandsRes.count || 0,
        birthdays: birthdayCount,
        strongSupporters: strong,
        undecided,
      });

      // Monthly chart
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthCounts = new Array(12).fill(0);
      (allContactsRes.data || []).forEach((c: any) => { monthCounts[new Date(c.created_at).getMonth()]++; });
      setMonthlyData(months.map((m, i) => ({ name: m, cadastros: monthCounts[i] })));
    };

    fetchStats();
  }, [tenantId]);

  const totalEngagement = Object.values(engagementData).reduce((a, b) => a + b, 0) || 1;
  const metaVotos = campaign?.meta_votos || 0;
  const projPct = metaVotos > 0 ? Math.min((projectedVotes / metaVotos) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Painel Estratégico</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border">
          <CalendarIcon className="h-4 w-4" />
          {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center"><Users className="h-7 w-7 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Eleitores Cadastrados</p><p className="text-3xl font-bold">{stats.contacts.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Target className="h-7 w-7 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Apoiadores Fortes</p><p className="text-3xl font-bold">{stats.strongSupporters}</p><p className="text-xs text-muted-foreground">Grau 4-5</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center"><MessageSquare className="h-7 w-7 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Indecisos</p><p className="text-3xl font-bold">{stats.undecided}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-full bg-info/10 flex items-center justify-center"><Gift className="h-7 w-7 text-info" /></div>
            <div><p className="text-sm text-muted-foreground">Aniversariantes Hoje</p><p className="text-3xl font-bold">{stats.birthdays}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Vote Projection & Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Apoiadores fortes</p>
                    <p className="text-xl font-bold text-success">{stats.strongSupporters}</p>
                  </div>
                  <div className="bg-warning/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">A conquistar</p>
                    <p className="text-xl font-bold text-warning">{stats.undecided}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhuma campanha cadastrada. Crie uma campanha para ver a projeção.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Resumo Financeiro</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/10 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Arrecadado</p>
                <p className="text-xl font-bold">R$ {financialSummary.donations.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Gasto</p>
                <p className="text-xl font-bold">R$ {financialSummary.expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-2xl font-bold ${(financialSummary.donations - financialSummary.expenses) < 0 ? "text-destructive" : "text-success"}`}>
                R$ {(financialSummary.donations - financialSummary.expenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            {campaign?.limite_gastos > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Limite legal</span>
                  <span>R$ {Number(campaign.limite_gastos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <Progress value={Math.min((financialSummary.expenses / Number(campaign.limite_gastos)) * 100, 100)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Cadastros por Mês</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="cadastros" fill="hsl(205, 85%, 50%)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Termômetro de Envolvimento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(engagementLabels).map(([key, label]) => {
              const count = engagementData[key] || 0;
              const pct = (count / totalEngagement) * 100;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{label}</span><span className="font-medium border rounded px-2 py-0.5 text-xs">{count}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${engagementColors[key]}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Neighborhood ranking */}
      {neighborhoodData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Top 10 Bairros por Apoiadores</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={neighborhoodData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" fontSize={12} /><YAxis type="category" dataKey="name" fontSize={11} width={120} /><Tooltip /><Bar dataKey="value" fill="hsl(145, 65%, 42%)" radius={[0, 4, 4, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
