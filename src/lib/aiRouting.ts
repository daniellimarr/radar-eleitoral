/**
 * Camada de abstração de modelos de IA — fonte única de verdade do roteamento.
 *
 * Por que existe: o sistema consome IA por *tarefa*, não por modelo. Este módulo
 * traduz (tarefa + preferência do usuário) -> id de modelo suportado, para que a
 * UI e a edge function nunca precisem embutir nomes de modelo em regras de negócio.
 *
 * Importante: apenas ids presentes em AI_MODELS são aceitos pelo gateway. Qualquer
 * outro valor é rejeitado com 400, por isso o roteamento sempre faz fallback.
 */

export type AiProvider = "google" | "openai";

export interface AiModelSpec {
  /** Id exato exigido pelo gateway (vendor/model). */
  readonly id: string;
  readonly provider: AiProvider;
  readonly label: string;
  /** Custo/latência relativos: 1 = mais barato/rápido, 3 = mais caro/capaz. */
  readonly tier: 1 | 2 | 3;
  readonly description: string;
}

/** Allowlist de modelos habilitados neste projeto. */
export const AI_MODELS: readonly AiModelSpec[] = [
  {
    id: "google/gemini-3.6-flash",
    provider: "google",
    label: "Gemini 3.6 Flash",
    tier: 1,
    description: "Rápido e econômico. Ideal para textos curtos e alto volume.",
  },
  {
    id: "google/gemini-3.1-pro-preview",
    provider: "google",
    label: "Gemini 3.1 Pro",
    tier: 2,
    description: "Raciocínio forte do Google, com contexto amplo.",
  },
  {
    id: "openai/gpt-5.5",
    provider: "openai",
    label: "GPT-5.5",
    tier: 3,
    description: "Máxima qualidade analítica. Padrão para análises estratégicas.",
  },
  {
    id: "openai/gpt-5.4-mini",
    provider: "openai",
    label: "GPT-5.4 Mini",
    tier: 1,
    description: "Equilíbrio entre custo e capacidade.",
  },
] as const;

export const DEFAULT_MODEL_ID = "openai/gpt-5.5";
export const FAST_MODEL_ID = "google/gemini-3.6-flash";

/** Tarefas de IA expostas pelo sistema. */
export type AiTask =
  | "chat"
  | "weekly_report"
  | "territorial"
  | "quick_tips"
  | "competitors"
  | "reputation"
  | "vote_projection"
  | "financial"
  | "whatsapp_messages"
  | "speech"
  | "demand_reply"
  | "social_post";

/** Preferência declarada pelo usuário/UI. */
export type AiRoutingPreference = "auto" | "quality" | "speed" | "gemini" | "openai";

/**
 * Tarefas que exigem raciocínio analítico profundo (cruzamento de dados,
 * projeções, diagnóstico). As demais são geração de texto curto, onde o modelo
 * rápido entrega qualidade equivalente por uma fração do custo.
 */
const DEEP_REASONING_TASKS: ReadonlySet<AiTask> = new Set<AiTask>([
  "chat",
  "weekly_report",
  "territorial",
  "competitors",
  "reputation",
  "vote_projection",
  "financial",
]);

export function isSupportedModel(modelId: string | null | undefined): boolean {
  if (!modelId) return false;
  return AI_MODELS.some((model) => model.id === modelId);
}

export function getModelSpec(modelId: string): AiModelSpec | undefined {
  return AI_MODELS.find((model) => model.id === modelId);
}

/**
 * Resolve o modelo para uma tarefa.
 *
 * Ordem de precedência (determinística, para permitir testes):
 * 1. Override explícito e suportado.
 * 2. Preferência de provedor (gemini/openai).
 * 3. Preferência de custo (speed) ou qualidade (quality).
 * 4. Heurística por tarefa (auto).
 */
export function resolveModel(
  task: AiTask,
  preference: AiRoutingPreference = "auto",
  override?: string | null,
): string {
  if (override && isSupportedModel(override)) return override;

  switch (preference) {
    case "gemini":
      return DEEP_REASONING_TASKS.has(task) ? "google/gemini-3.1-pro-preview" : FAST_MODEL_ID;
    case "openai":
      return DEEP_REASONING_TASKS.has(task) ? DEFAULT_MODEL_ID : "openai/gpt-5.4-mini";
    case "quality":
      return DEFAULT_MODEL_ID;
    case "speed":
      return FAST_MODEL_ID;
    case "auto":
    default:
      return DEEP_REASONING_TASKS.has(task) ? DEFAULT_MODEL_ID : FAST_MODEL_ID;
  }
}

/** Mensagens de erro amigáveis por status HTTP do gateway. */
export function describeAiError(status: number | null | undefined, fallback?: string): string {
  switch (status) {
    case 401:
    case 403:
      return "A IA não está autorizada para este gabinete. Contate o suporte.";
    case 402:
      return "Os créditos de IA do workspace acabaram. Adicione créditos para continuar.";
    case 429:
      return "Muitas requisições em sequência. Aguarde alguns segundos e tente novamente.";
    case 400:
      return "A solicitação enviada à IA é inválida. Reduza o texto e tente de novo.";
    default:
      if (status && status >= 500) {
        return "O provedor de IA está instável neste momento. Tente novamente em instantes.";
      }
      return fallback || "Não foi possível concluir a operação de IA.";
  }
}
