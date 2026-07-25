import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { describeAiError, type AiRoutingPreference, type AiTask } from "@/lib/aiRouting";

/**
 * Executa uma tarefa de IA não conversacional (análises e ferramentas).
 * O texto chega em streaming, então a UI mostra o resultado sendo escrito.
 */
export interface AiTaskState {
  output: string;
  model: string | null;
  isRunning: boolean;
  error: string | null;
}

const AI_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export function useAiTask() {
  const [state, setState] = useState<AiTaskState>({
    output: "",
    model: null,
    isRunning: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({ output: "", model: null, isRunning: false, error: null });
  }, []);

  const run = useCallback(
    async (
      task: AiTask,
      params?: Record<string, string>,
      preference: AiRoutingPreference = "auto",
    ): Promise<boolean> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ output: "", model: null, isRunning: true, error: null });

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          setState((s) => ({ ...s, isRunning: false, error: "Sessão expirada. Faça login novamente." }));
          return false;
        }

        const response = await fetch(AI_ENDPOINT, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ task, params, preference }),
        });

        if (!response.ok || !response.body) {
          let message = describeAiError(response.status);
          try {
            const payload = await response.json();
            if (payload?.error) message = payload.error;
          } catch {
            /* corpo não-JSON: mantém a mensagem padrão do status */
          }
          setState((s) => ({ ...s, isRunning: false, error: message }));
          return false;
        }

        const model = response.headers.get("X-Ai-Model");
        setState((s) => ({ ...s, model }));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setState((s) => ({ ...s, output: accumulated }));
        }

        setState((s) => ({ ...s, output: accumulated, isRunning: false }));
        return accumulated.trim().length > 0;
      } catch (error) {
        if (controller.signal.aborted) return false;
        const message = error instanceof Error ? error.message : "Falha de conexão com a IA.";
        setState((s) => ({ ...s, isRunning: false, error: message }));
        return false;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isRunning: false }));
  }, []);

  return { ...state, run, cancel, reset };
}
