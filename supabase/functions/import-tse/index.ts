// Importa zonas/seções eleitorais do Portal de Dados Abertos do TSE
// Modo "auto": baixa o ZIP do CDN do TSE e importa
// Modo "csv":  recebe o conteúdo de um CSV já baixado manualmente
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { unzipSync } from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface SectionAgg {
  uf: string;
  city: string | null;
  zone: string;
  section: string;
  location_name: string | null;
  address: string | null;
  neighborhood: string | null;
  registered_voters: number;
}

/** Divide uma linha CSV respeitando aspas duplas. */
function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === sep && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim().replace(/^"|"$/g, "").trim());
}

const pad = (v: string, n = 4) => {
  const digits = (v || "").replace(/\D/g, "");
  return digits ? digits.padStart(n, "0") : "";
};

const clean = (v: string | undefined) => {
  const t = (v || "").trim();
  if (!t || t === "#NULO#" || t === "#NE#" || t === "-1") return null;
  return t;
};

/**
 * Agrega qualquer layout do TSE que contenha zona/seção.
 * Suporta perfil_eleitor_secao (linhas por perfil) e eleitorado_local_votacao.
 */
function parseTseCsv(text: string, cityFilter?: string): { rows: SectionAgg[]; header: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], header: [] };

  const sep = (lines[0].match(/;/g)?.length || 0) >= (lines[0].match(/,/g)?.length || 0) ? ";" : ",";
  const header = splitCsvLine(lines[0], sep).map((h) => h.toUpperCase().replace(/^\uFEFF/, ""));

  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iUf = idx("SG_UF", "SG_UF_SECAO", "UF");
  const iCity = idx("NM_MUNICIPIO", "NM_LOCALIDADE", "MUNICIPIO");
  const iZone = idx("NR_ZONA", "ZONA");
  const iSection = idx("NR_SECAO", "SECAO");
  const iLocal = idx("NM_LOCAL_VOTACAO", "NM_LOCALIDADE_VOTACAO", "LOCAL_VOTACAO");
  const iAddr = idx("DS_ENDERECO", "ENDERECO");
  const iHood = idx("NM_BAIRRO", "BAIRRO");
  const iQty = idx(
    "QT_ELEITORES_PERFIL",
    "QT_ELEITORES_SECAO",
    "QT_ELEITORES_LOCAL_VOTACAO",
    "QT_ELEITOR",
    "QT_ELEITORES",
  );

  if (iZone < 0 || iSection < 0) {
    throw new Error(
      `CSV sem colunas de zona/seção. Colunas encontradas: ${header.slice(0, 15).join(", ")}`,
    );
  }

  const filter = cityFilter?.trim().toUpperCase();
  const map = new Map<string, SectionAgg>();

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    const zone = pad(cols[iZone] || "");
    const section = pad(cols[iSection] || "");
    if (!zone || !section) continue;

    const city = iCity >= 0 ? clean(cols[iCity]) : null;
    if (filter && (city || "").toUpperCase().indexOf(filter) === -1) continue;

    const uf = (iUf >= 0 ? clean(cols[iUf]) : null)?.toUpperCase() || "";
    const key = `${uf}|${zone}|${section}`;
    const qty = iQty >= 0 ? parseInt((cols[iQty] || "0").replace(/\D/g, ""), 10) || 0 : 0;

    const existing = map.get(key);
    if (existing) {
      existing.registered_voters += qty;
      existing.location_name ||= iLocal >= 0 ? clean(cols[iLocal]) : null;
      existing.address ||= iAddr >= 0 ? clean(cols[iAddr]) : null;
      existing.neighborhood ||= iHood >= 0 ? clean(cols[iHood]) : null;
    } else {
      map.set(key, {
        uf,
        city,
        zone,
        section,
        location_name: iLocal >= 0 ? clean(cols[iLocal]) : null,
        address: iAddr >= 0 ? clean(cols[iAddr]) : null,
        neighborhood: iHood >= 0 ? clean(cols[iHood]) : null,
        registered_voters: qty,
      });
    }
  }

  return { rows: [...map.values()], header };
}

async function downloadTseCsv(uf: string): Promise<string> {
  const url =
    `https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitor_secao/perfil_eleitor_secao_ATUAL_${uf}.zip`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "*/*",
      "Referer": "https://dadosabertos.tse.jus.br/",
    },
  });

  if (!res.ok) {
    throw new Error(
      `O TSE recusou o download (HTTP ${res.status}). Baixe o arquivo manualmente em dadosabertos.tse.jus.br e use a importação por CSV.`,
    );
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(buf);
  const name = Object.keys(files).find((f) => f.toLowerCase().endsWith(".csv"));
  if (!name) throw new Error("O arquivo baixado do TSE não contém CSV.");

  // Arquivos do TSE são ISO-8859-1
  return new TextDecoder("iso-8859-1").decode(files[name]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ ok: false, error: "Sessão inválida. Faça login novamente." });

    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ ok: false, error: "Sessão inválida. Faça login novamente." });

    const { data: profile } = await admin
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const tenantId = profile?.tenant_id;
    if (!tenantId) return json({ ok: false, error: "Gabinete não identificado." });

    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode === "csv" ? "csv" : "auto";
    const uf: string = (body.uf || "RR").toString().toUpperCase().slice(0, 2);
    const cityFilter: string | undefined = body.city || undefined;
    const replaceExisting = body.replace === true;

    const csvText = mode === "csv"
      ? String(body.csv || "")
      : await downloadTseCsv(uf);

    if (!csvText.trim()) return json({ ok: false, error: "Arquivo CSV vazio." });

    const { rows } = parseTseCsv(csvText, cityFilter);
    if (rows.length === 0) {
      return json({ ok: false, error: "Nenhuma seção encontrada com os filtros informados." });
    }

    if (replaceExisting) {
      const { error: delError } = await admin
        .from("electoral_sections")
        .delete()
        .eq("tenant_id", tenantId);
      if (delError) throw delError;
    }

    const payload = rows.map((r) => ({
      tenant_id: tenantId,
      uf: r.uf || uf,
      city: r.city,
      zone: r.zone,
      section: r.section,
      location_name: r.location_name,
      address: r.address,
      neighborhood: r.neighborhood,
      registered_voters: r.registered_voters,
      source: "tse",
    }));

    let imported = 0;
    for (let i = 0; i < payload.length; i += 500) {
      const batch = payload.slice(i, i + 500);
      const { error } = await admin
        .from("electoral_sections")
        .upsert(batch, { onConflict: "tenant_id,uf,zone,section" });
      if (error) throw error;
      imported += batch.length;
    }

    return json({
      ok: true,
      imported,
      zones: new Set(rows.map((r) => r.zone)).size,
      voters: rows.reduce((s, r) => s + r.registered_voters, 0),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("import-tse error:", msg);
    return json({ ok: false, error: msg });
  }
});
