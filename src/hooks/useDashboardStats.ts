import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { MAIN_TENANT } from "@/lib/constants";

const engagementWeight: Record<string, number> = {
  conquistado: 0.9,
  criando_envolvimento: 0.6,
  em_prospeccao: 0.3,
  nao_trabalhado: 0.1,
  falta_trabalhar: 0.15,
  envolvimento_perdido: 0.05,
};

export function useDashboardStats(tenantId: string | null, isOperador: boolean) {
  const effectiveTenantId = tenantId || MAIN_TENANT;

  return useQuery({
    queryKey: ["dashboard-stats", effectiveTenantId],
    queryFn: async () => {
      if (isOperador) return null;

      const now = new Date();
      const todayStart = format(now, "yyyy-MM-dd") + "T00:00:00";
      const todayEnd = format(now, "yyyy-MM-dd") + "T23:59:59";

      const [contactRes, appointmentsRes, birthdayRes, engagementRes, allContactsRes, campaignRes, donationsRes, expensesRes] = await Promise.all([
        supabase.from("contacts_decrypted").select("*", { count: "exact", head: true }).eq("tenant_id", effectiveTenantId).is("deleted_at", null),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", effectiveTenantId).gte("start_time", todayStart).lte("start_time", todayEnd),
        supabase.from("contacts_decrypted").select("birth_date").eq("tenant_id", effectiveTenantId).is("deleted_at", null).not("birth_date", "is", null),
        supabase.from("contacts_decrypted").select("engagement, neighborhood").eq("tenant_id", effectiveTenantId).is("deleted_at", null),
        supabase.from("contacts_decrypted").select("created_at").eq("tenant_id", effectiveTenantId).is("deleted_at", null),
        supabase.from("campaigns").select("*").eq("tenant_id", effectiveTenantId).order("created_at", { ascending: false }).limit(1),
        supabase.from("donations").select("valor").eq("tenant_id", effectiveTenantId),
        supabase.from("expenses").select("valor").eq("tenant_id", effectiveTenantId),
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

      const totalDonations = (donationsRes.data || []).reduce((s: number, d: any) => s + Number(d.valor), 0);
      const totalExpenses = (expensesRes.data || []).reduce((s: number, e: any) => s + Number(e.valor), 0);

      // Monthly chart
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthCounts = new Array(12).fill(0);
      (allContactsRes.data || []).forEach((c: any) => { monthCounts[new Date(c.created_at).getMonth()]++; });
      const monthlyData = months.map((m, i) => ({ name: m, cadastros: monthCounts[i] }));

      return {
        stats: {
          contacts: contactRes.count || 0,
          appointmentsToday: appointmentsRes.count || 0,
          birthdays: birthdayCount,
          citizenParticipates: 0,
        },
        engagementData: engagement,
        projectedVotes: Math.round(projVotes),
        neighborhoodData: Object.entries(neighborhoodMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value })),
        campaign: campaignRes.data?.[0] || null,
        financialSummary: { donations: totalDonations, expenses: totalExpenses },
        monthlyData,
      };
    },
    enabled: !!effectiveTenantId && !isOperador,
  });
}
