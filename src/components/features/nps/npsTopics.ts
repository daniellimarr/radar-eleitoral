/**
 * Temas prioritários oferecidos no formulário público de NPS.
 * Mantidos centralizados para que painel e formulário público nunca divirjam.
 */
export const NPS_TOPICS = [
  "Saúde",
  "Educação",
  "Segurança",
  "Emprego e Renda",
  "Infraestrutura e Saneamento",
  "Transporte Público",
  "Esporte e Cultura",
  "Assistência Social",
  "Meio Ambiente",
  "Outro",
] as const;

export type NpsTopic = (typeof NPS_TOPICS)[number];

export type NpsStatus = "rascunho" | "ativa" | "encerrada";

export const NPS_STATUS_LABELS: Record<NpsStatus, string> = {
  rascunho: "Rascunho (não visível)",
  ativa: "Ativa (coleta respostas)",
  encerrada: "Encerrada",
};

export interface NpsSurvey {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  status: NpsStatus;
  created_at: string;
}

export interface NpsResponse {
  id: string;
  survey_id: string;
  score: number;
  main_topic: string | null;
  respondent_name: string | null;
  neighborhood: string | null;
  comment: string | null;
  created_at: string;
}

/** Classificação NPS padrão: 0-6 detrator, 7-8 neutro, 9-10 promotor. */
export function classifyScore(score: number): "detrator" | "neutro" | "promotor" {
  if (score <= 6) return "detrator";
  if (score <= 8) return "neutro";
  return "promotor";
}

/** NPS = %promotores - %detratores (escala -100 a 100). */
export function calcNps(scores: number[]): number {
  if (scores.length === 0) return 0;
  let promoters = 0;
  let detractors = 0;
  for (const s of scores) {
    const c = classifyScore(s);
    if (c === "promotor") promoters += 1;
    else if (c === "detrator") detractors += 1;
  }
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

/** Normaliza um texto livre em slug válido para URL (sem sufixo aleatório). */
export function sanitizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Gera um slug curto e único a partir do título da pesquisa. */
export function buildSlug(title: string): string {
  // Mantemos apenas as 3 primeiras palavras para o link ficar curto.
  const base = sanitizeSlug(title).split("-").filter(Boolean).slice(0, 3).join("-").slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "pesquisa"}-${suffix}`;
}

