import type { AiTask } from "@/lib/aiRouting";

/** Catálogo declarativo do Assistente IA — usado pela UI de chat, análises e ferramentas. */

export interface SuggestedQuestionGroup {
  group: string;
  items: { label: string; prompt: string }[];
}

export const SUGGESTED_QUESTIONS: SuggestedQuestionGroup[] = [
  {
    group: "Visão geral",
    items: [
      { label: "Status geral", prompt: "Faça um diagnóstico geral da minha campanha hoje." },
      { label: "Pontos fortes", prompt: "Quais são os principais pontos fortes da campanha?" },
      { label: "Riscos", prompt: "Quais riscos mais ameaçam a campanha agora?" },
      { label: "Próximos passos", prompt: "Quais os próximos passos que devo executar nesta semana?" },
    ],
  },
  {
    group: "Territorial",
    items: [
      { label: "Bairro prioritário", prompt: "Quais bairros devo priorizar e por quê?" },
      { label: "Onde perco votos", prompt: "Em quais bairros estou perdendo votos ou com cobertura fraca?" },
      { label: "Cobertura da equipe", prompt: "Como está a cobertura das lideranças por bairro?" },
      { label: "Neutros a converter", prompt: "Onde estão os eleitores neutros com maior chance de conversão?" },
    ],
  },
  {
    group: "Financeiro",
    items: [
      { label: "Financeiro", prompt: "Como está a saúde financeira da campanha?" },
      { label: "Onde investir", prompt: "Onde devo investir a verba disponível para maximizar votos?" },
      { label: "Projeção de verba", prompt: "Faça uma projeção de gastos até o fim da campanha." },
    ],
  },
  {
    group: "Eleitores",
    items: [
      { label: "Perfil apoiadores", prompt: "Qual o perfil predominante dos meus apoiadores?" },
      { label: "Converter neutros", prompt: "Como converter os eleitores não trabalhados em apoiadores?" },
      { label: "Segmentação", prompt: "Sugira uma segmentação da base para ações direcionadas." },
    ],
  },
  {
    group: "Estratégia",
    items: [
      { label: "Diferenciação", prompt: "Como me diferenciar dos concorrentes com os dados atuais?" },
      { label: "Projeção de votos", prompt: "Qual minha projeção de votos frente à meta?" },
      { label: "Estratégia 30 dias", prompt: "Monte uma estratégia detalhada para os próximos 30 dias." },
      { label: "Mensagem para redes", prompt: "Qual mensagem devo priorizar nas redes sociais agora?" },
    ],
  },
  {
    group: "Comunicação",
    items: [
      { label: "Msg apoiadores", prompt: "Escreva uma mensagem de mobilização para meus apoiadores." },
      { label: "Responder críticas", prompt: "Como responder críticas sobre atuação no bairro?" },
      { label: "Pautas eleitorais", prompt: "Quais pautas devo defender com base nas demandas recebidas?" },
    ],
  },
];

export interface AnalysisDefinition {
  task: AiTask;
  title: string;
  description: string;
  featured?: boolean;
  accent?: string;
}

export const ANALYSES: AnalysisDefinition[] = [
  {
    task: "weekly_report",
    title: "Relatório Semanal Estratégico",
    description: "Resumo executivo, alertas e 3 prioridades para esta semana",
    featured: true,
  },
  {
    task: "territorial",
    title: "Análise Territorial",
    description: "Bairros prioritários, riscos e estratégia de campo",
  },
  {
    task: "quick_tips",
    title: "5 Dicas Prioritárias",
    description: "Ações urgentes baseadas nos dados atuais",
  },
  {
    task: "competitors",
    title: "Análise vs. Concorrentes",
    description: "Posicionamento, vulnerabilidades e diferenciação",
    accent: "border-l-4 border-l-destructive",
  },
  {
    task: "reputation",
    title: "Análise de Reputação",
    description: "Diagnóstico e tendência de imagem pública",
  },
  {
    task: "vote_projection",
    title: "Projeção de Votos",
    description: "Cenários conservador e otimista com estratégia",
  },
  {
    task: "financial",
    title: "Análise Financeira",
    description: "Saúde financeira, projeção de gastos e recomendações",
  },
];

export const PROFILE_OPTIONS = ["Apoiador", "Neutro", "Liderança", "Indeciso", "Opositor"];
export const OBJECTIVE_OPTIONS = ["Engajamento", "Convite para evento", "Agradecimento", "Pedido de voto", "Reativação"];
export const TONE_OPTIONS = ["Amigável", "Formal", "Emotivo", "Direto"];
export const SPEECH_DURATIONS = ["1 min", "3 min", "5 min", "10 min"];
export const DEMAND_AREAS = ["Geral", "Saúde", "Educação", "Infraestrutura", "Segurança", "Assistência social"];
export const SOCIAL_NETWORKS = ["Instagram", "Facebook", "X (Twitter)", "TikTok"];
