import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Fuso horário oficial da campanha: Boa Vista / Roraima (UTC-4, sem horário de verão).
 *
 * Todos os agendamentos são criados e exibidos neste fuso, independentemente do
 * fuso do dispositivo de quem cadastra ou de quem consulta a agenda.
 */
export const CAMPAIGN_TIMEZONE = "America/Boa_Vista";

/** Roraima não adota horário de verão — o offset é fixo. */
export const CAMPAIGN_TZ_OFFSET = "-04:00";

/**
 * Converte um horário "de parede" (ex.: "2026-07-30T18:30" vindo de um
 * datetime-local ou de um seletor de horário) em um ISO absoluto ancorado em
 * Boa Vista. Sem isso, o Postgres interpreta a string como UTC e o horário
 * aparece deslocado (18:30 → 14:30).
 */
export function toCampaignIso(localDateTime?: string | null): string | null {
  if (!localDateTime) return null;
  const value = localDateTime.trim();
  if (!value) return null;
  // Já possui offset ou marcação de UTC — devolve como está.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(value)) return value;
  const withSeconds = /\d{2}:\d{2}:\d{2}$/.test(value) ? value : `${value}:00`;
  return `${withSeconds}${CAMPAIGN_TZ_OFFSET}`;
}

/**
 * Retorna um Date cujo horário local corresponde ao horário de parede em
 * Boa Vista, permitindo formatar com date-fns sem depender do fuso do browser.
 */
export function toCampaignDate(value?: string | number | Date | null): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const base = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(base.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPAIGN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(base);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const hour = get("hour") % 24; // Intl pode devolver "24" à meia-noite
  return new Date(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
}

/** Formata um instante no fuso da campanha. Retorna `fallback` se inválido. */
export function formatCampaign(
  value?: string | number | Date | null,
  pattern = "dd/MM/yyyy HH:mm",
  fallback = "-",
): string {
  const d = toCampaignDate(value);
  if (!d) return fallback;
  try {
    return format(d, pattern, { locale: ptBR });
  } catch {
    return fallback;
  }
}
