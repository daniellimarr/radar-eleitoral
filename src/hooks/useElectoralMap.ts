import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MAIN_TENANT } from "@/lib/constants";

export interface ElectoralSectionRow {
  id: string;
  uf: string;
  city: string | null;
  zone: string;
  section: string;
  location_name: string | null;
  address: string | null;
  neighborhood: string | null;
  registered_voters: number;
  last_election_votes: number | null;
  vote_goal: number | null;
  latitude: number | null;
  longitude: number | null;
  contacts_count: number;
}

export function useElectoralMap(tenantId: string | null) {
  const effectiveTenantId = tenantId || MAIN_TENANT;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["electoral-map", effectiveTenantId],
    queryFn: async (): Promise<ElectoralSectionRow[]> => {
      const { data, error } = await supabase.rpc("get_electoral_map", {
        _tenant_id: effectiveTenantId,
      });
      if (error) throw error;
      return (data || []) as ElectoralSectionRow[];
    },
    enabled: !!effectiveTenantId,
  });

  return {
    ...query,
    tenantId: effectiveTenantId,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["electoral-map"] }),
  };
}
