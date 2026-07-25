import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NpsResponse, NpsSurvey } from "@/components/features/nps/npsTopics";

/** Carrega as pesquisas NPS do gabinete atual. */
export function useNpsSurveys(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: ["nps-surveys", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<NpsSurvey[]> => {
      const { data, error } = await supabase
        .from("nps_surveys")
        .select("*")
        .eq("tenant_id", tenantId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NpsSurvey[];
    },
  });
}

/** Carrega todas as respostas do gabinete (usado para métricas e listagem). */
export function useNpsResponses(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: ["nps-responses", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<NpsResponse[]> => {
      const { data, error } = await supabase
        .from("nps_responses")
        .select("id, survey_id, score, main_topic, respondent_name, neighborhood, comment, created_at")
        .eq("tenant_id", tenantId as string)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as NpsResponse[];
    },
  });
}
