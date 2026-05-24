import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function useOperatorStats(effectiveTenantId: string) {
  return useQuery({
    queryKey: ["operator-stats", effectiveTenantId],
    queryFn: async () => {
      const now = new Date();
      const todayStart = format(now, "yyyy-MM-dd") + "T00:00:00";
      const todayEnd = format(now, "yyyy-MM-dd") + "T23:59:59";

      const [apptRes, demandRes, contactsRes] = await Promise.all([
        supabase.from("appointments").select("*", { count: "exact", head: true })
          .eq("tenant_id", effectiveTenantId).gte("start_time", todayStart).lte("start_time", todayEnd),
        supabase.from("demands").select("*", { count: "exact", head: true })
          .eq("tenant_id", effectiveTenantId).in("status", ["aberta", "em_andamento"]),
        supabase.from("contacts_decrypted").select("id, name, birth_date, created_at")
          .eq("tenant_id", effectiveTenantId).is("deleted_at", null)
          .order("created_at", { ascending: false }).limit(10),
      ]);

      return {
        todayAppointments: apptRes.count || 0,
        pendingDemands: demandRes.count || 0,
        recentContacts: contactsRes.data || [],
      };
    },
    enabled: !!effectiveTenantId,
  });
}
