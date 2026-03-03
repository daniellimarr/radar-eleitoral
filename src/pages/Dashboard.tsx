import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, MessageSquare, Gift, Megaphone, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

export default function Dashboard() {
  const { tenantId } = useAuth();
  const [stats, setStats] = useState({ contacts: 0, demandsOpen: 0, birthdays: 0 });
  const [engagementData, setEngagementData] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    const fetchStats = async () => {
      const { count: contactCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const { count: demandsCount } = await supabase
        .from("demands")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "aberta");

      const now = new Date();
      const todayMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const { data: birthdayData } = await supabase
        .from("contacts")
        .select("birth_date")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .not("birth_date", "is", null);

      const birthdayCount = (birthdayData || []).filter((c: any) => {
        const [year, month, day] = c.birth_date.split("-");
        return `${month}-${day}` === todayMMDD;
      }).length;

      setStats({
        contacts: contactCount || 0,
        demandsOpen: demandsCount || 0,
        birthdays: birthdayCount || 0,
      });

      // Engagement
      const { data: contacts } = await supabase
        .from("contacts")
        .select("engagement")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      if (contacts) {
        const engagement: Record<string, number> = {};
        contacts.forEach((c: any) => {
          const e = c.engagement || "nao_trabalhado";
          engagement[e] = (engagement[e] || 0) + 1;
        });
        setEngagementData(engagement);
      }

      // Monthly chart (simple by month)
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const { data: allContacts } = await supabase
        .from("contacts")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const monthCounts = new Array(12).fill(0);
      allContacts?.forEach((c: any) => {
        const month = new Date(c.created_at).getMonth();
        monthCounts[month]++;
      });

      setMonthlyData(months.map((m, i) => ({ name: m, cadastros: monthCounts[i] })));
    };

    fetchStats();
  }, [tenantId]);

  const totalEngagement = Object.values(engagementData).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Boa tarde</p>
          <h1 className="text-3xl font-bold">Início</h1>
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
            <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
              <Users className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contatos</p>
              <p className="text-3xl font-bold">{stats.contacts.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-full bg-info/10 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Demandas Abertas</p>
              <p className="text-3xl font-bold">{stats.demandsOpen}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center">
              <Gift className="h-7 w-7 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aniversariantes hoje</p>
              <p className="text-3xl font-bold">{stats.birthdays}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <Megaphone className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cidadão participa</p>
              <p className="text-3xl font-bold">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Visão geral</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="cadastros" fill="hsl(205, 85%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Thermometer */}
        <Card>
          <CardHeader>
            <CardTitle>Termômetro de envolvimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(engagementLabels).map(([key, label]) => {
              const count = engagementData[key] || 0;
              const pct = (count / totalEngagement) * 100;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium border rounded px-2 py-0.5 text-xs">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${engagementColors[key]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
