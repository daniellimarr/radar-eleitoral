// Address normalization helpers for agenda / visit forms.
// Reduces mismatches on the map by cleaning CEP, neighborhood and city.

/** Keeps only digits, caps at 8 chars and formats as 00000-000. */
export function formatCep(input: string): string {
  const digits = (input || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Returns only the 8 CEP digits (or empty string when incomplete). */
export function cleanCep(input: string): string {
  const digits = (input || "").replace(/\D/g, "");
  return digits.length === 8 ? digits : "";
}

/** Removes accents, collapses whitespace and trims. */
export function normalizeText(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Title-cases each word (keeps small connectors lower-case). */
export function toTitleCase(input: string): string {
  const smalls = new Set(["de", "da", "do", "das", "dos", "e"]);
  return normalizeText(input)
    .toLowerCase()
    .split(" ")
    .map((w, i) =>
      i > 0 && smalls.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** Uppercases UF (2 letters). */
export function normalizeUf(input: string): string {
  return (input || "").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}

export interface NormalizedAddress {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  uf: string;
}

/** Builds a Google-Maps-friendly single-line address from parts. */
export function buildFullAddress(a: Partial<NormalizedAddress>): string {
  const streetPart = [a.street, a.number].filter(Boolean).join(", ");
  const cityPart = [a.city, a.uf].filter(Boolean).join(" - ");
  return [streetPart, a.neighborhood, cityPart, a.cep]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
}

/** Looks up a CEP on BrasilAPI. Returns null when not found/invalid. */
export async function lookupCep(cep: string): Promise<NormalizedAddress | null> {
  const clean = cleanCep(cep);
  if (!clean) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`);
    if (!res.ok) return null;
    const j = await res.json();
    return {
      cep: formatCep(clean),
      street: toTitleCase(j.street || ""),
      number: "",
      neighborhood: toTitleCase(j.neighborhood || ""),
      city: toTitleCase(j.city || ""),
      uf: normalizeUf(j.state || ""),
    };
  } catch {
    return null;
  }
}
