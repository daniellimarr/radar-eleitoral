import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileDown, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MAIN_TENANT } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Field aliases (Portuguese headers -> internal fields)
const FIELD_MAP: Record<string, string> = {
  nome: "name", "nome completo": "name", name: "name",
  apelido: "nickname", nickname: "nickname",
  sexo: "gender", genero: "gender", gênero: "gender",
  "data de nascimento": "birth_date", nascimento: "birth_date", "data_nascimento": "birth_date",
  telefone: "phone", celular: "phone", whatsapp: "phone", fone: "phone",
  email: "email", "e-mail": "email",
  cep: "cep",
  endereco: "address", endereço: "address", rua: "address",
  numero: "address_number", número: "address_number", "nº": "address_number",
  bairro: "neighborhood",
  cidade: "city", municipio: "city", município: "city",
  estado: "state", uf: "state",
  "zona": "voting_zone", "zona eleitoral": "voting_zone",
  "secao": "voting_section", "seção": "voting_section", "seção eleitoral": "voting_section",
  "local de votacao": "voting_location", "local de votação": "voting_location",
};

const norm = (s: string) => s.toString().toLowerCase().trim().replace(/\s+/g, " ");
const normPhone = (s?: string | null) => (s || "").replace(/\D/g, "");
const normEmail = (s?: string | null) => (s || "").toLowerCase().trim();

interface Row {
  [key: string]: any;
}

type DupAction = "skip" | "merge" | "new";
type Existing = { id: string; name: string; phone: string | null; email: string | null };

interface EnrichedRow extends Row {
  _dup?: Existing | null;
  _action: DupAction;
}

function mapRow(raw: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = FIELD_MAP[norm(k)];
    if (key && v !== undefined && v !== null && String(v).trim() !== "") {
      out[key] = typeof v === "string" ? v.trim() : v;
    }
  }
  return out;
}

async function parseExcel(file: File): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "", raw: false });
  return rows.map(mapRow).filter(r => r.name);
}

async function parsePdf(file: File): Promise<Row[]> {
  const pdfjs: any = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const byLine: Record<number, string[]> = {};
    for (const it of content.items as any[]) {
      const y = Math.round(it.transform[5]);
      (byLine[y] ??= []).push(it.str);
    }
    Object.keys(byLine)
      .sort((a, b) => Number(b) - Number(a))
      .forEach(y => lines.push(byLine[Number(y)].join(" ").trim()));
  }
  const clean = lines.filter(l => l.trim());
  if (!clean.length) return [];
  const sep = clean[0].includes("\t") ? /\t+/ : clean[0].includes(",") ? /\s*,\s*/ : /\s{2,}/;
  const headers = clean[0].split(sep).map(h => h.trim());
  const rows: Row[] = [];
  for (let i = 1; i < clean.length; i++) {
    const parts = clean[i].split(sep);
    if (parts.length < 2) continue;
    const raw: Row = {};
    headers.forEach((h, idx) => { raw[h] = parts[idx] ?? ""; });
    const mapped = mapRow(raw);
    if (mapped.name) rows.push(mapped);
  }
  return rows;
}

function downloadTemplate() {
  const headers = ["nome", "apelido", "sexo", "data de nascimento", "telefone", "email", "cep", "endereco", "numero", "bairro", "cidade", "estado"];
  const example = ["João da Silva", "Joãozinho", "M", "1985-03-15", "95991234567", "joao@email.com", "69300000", "Rua Exemplo", "100", "Centro", "Boa Vista", "RR"];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contatos");
  XLSX.writeFile(wb, "modelo-importacao-contatos.xlsx");
}

function findDuplicate(row: Row, existing: Existing[]): Existing | null {
  const name = norm(row.name || "");
  const phone = normPhone(row.phone);
  const email = normEmail(row.email);
  if (!name) return null;
  for (const e of existing) {
    if (norm(e.name) !== name) continue;
    if (phone && normPhone(e.phone) === phone) return e;
    if (email && normEmail(e.email) === email) return e;
  }
  return null;
}

export function ImportContactsDialog() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<EnrichedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [defaultAction, setDefaultAction] = useState<DupAction>("skip");

  const effectiveTenantId = tenantId || MAIN_TENANT;
  const dupCount = preview.filter(r => r._dup).length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setPreview([]);
    try {
      const ext = file.name.toLowerCase().split(".").pop();
      let rows: Row[] = [];
      if (ext === "pdf") rows = await parsePdf(file);
      else if (["xlsx", "xls", "csv"].includes(ext || "")) rows = await parseExcel(file);
      else throw new Error("Formato não suportado. Use Excel (.xlsx/.xls), CSV ou PDF.");
      if (!rows.length) throw new Error("Nenhum contato válido encontrado. Verifique se há uma coluna 'nome'.");

      // Load existing contacts for duplicate detection
      const { data: existingRaw, error } = await supabase
        .from("contacts_decrypted")
        .select("id, name, phone, email")
        .eq("tenant_id", effectiveTenantId)
        .is("deleted_at", null);
      if (error) throw error;
      const existing: Existing[] = (existingRaw || []) as any;

      const enriched: EnrichedRow[] = rows.map(r => {
        const dup = findDuplicate(r, existing);
        return { ...r, _dup: dup, _action: dup ? "skip" : "new" };
      });

      setPreview(enriched);
      const dups = enriched.filter(r => r._dup).length;
      toast.success(`${rows.length} contato(s) reconhecido(s)${dups ? ` — ${dups} duplicado(s) detectado(s)` : ""}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao ler arquivo");
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  };

  const applyDefaultToAll = (action: DupAction) => {
    setDefaultAction(action);
    setPreview(prev => prev.map(r => (r._dup ? { ...r, _action: action } : r)));
  };

  const setRowAction = (idx: number, action: DupAction) => {
    setPreview(prev => prev.map((r, i) => (i === idx ? { ...r, _action: action } : r)));
  };

  const handleImport = async () => {
    if (!preview.length || !user) return;
    setImporting(true);
    let inserted = 0, merged = 0, skipped = 0, failed = 0;

    // Split into inserts vs updates
    const toInsert: any[] = [];
    const toUpdate: { id: string; payload: any }[] = [];

    for (const r of preview) {
      const { _dup, _action, ...clean } = r;
      if (_dup && _action === "skip") { skipped++; continue; }
      if (_dup && _action === "merge") {
        toUpdate.push({ id: _dup.id, payload: clean });
      } else {
        toInsert.push({
          name: String(clean.name),
          ...clean,
          tenant_id: effectiveTenantId,
          registered_by: user.id,
          city: clean.city || "Boa Vista",
          state: clean.state || "RR",
          engagement: "nao_trabalhado" as const,
        });
      }
    }

    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { error, data } = await supabase.from("contacts").insert(batch).select("id");
      if (error) { failed += batch.length; console.error(error); }
      else inserted += data?.length || 0;
    }

    // Merge (update) sequentially
    for (const u of toUpdate) {
      const { error } = await supabase.from("contacts").update(u.payload).eq("id", u.id);
      if (error) { failed++; console.error(error); }
      else merged++;
    }

    setImporting(false);
    const parts = [];
    if (inserted) parts.push(`${inserted} novo(s)`);
    if (merged) parts.push(`${merged} mesclado(s)`);
    if (skipped) parts.push(`${skipped} ignorado(s)`);
    if (failed) parts.push(`${failed} falha(s)`);
    if (inserted || merged) toast.success(`Importação concluída: ${parts.join(", ")}`);
    else if (failed) toast.error(`Falha na importação: ${parts.join(", ")}`);
    else toast.info(`Nada importado: ${parts.join(", ")}`);

    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    setPreview([]);
    setFileName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription>
            Envie um arquivo Excel (.xlsx), CSV ou PDF. A coluna <strong>nome</strong> é obrigatória.
            Duplicados são detectados por <strong>nome + telefone</strong> ou <strong>nome + email</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileDown className="h-4 w-4 mr-1" /> Baixar Modelo Excel
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              onChange={handleFile}
              disabled={parsing || importing}
              className="block w-full text-sm"
            />
            {fileName && <p className="text-xs text-muted-foreground mt-2">Arquivo: {fileName}</p>}
            {parsing && (
              <p className="text-sm mt-2 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Lendo arquivo...
              </p>
            )}
          </div>

          {dupCount > 0 && (
            <div className="border rounded-md p-3 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                {dupCount} duplicado(s) detectado(s). Ação padrão para todos:
              </div>
              <RadioGroup
                value={defaultAction}
                onValueChange={(v) => applyDefaultToAll(v as DupAction)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="skip" id="da-skip" />
                  <Label htmlFor="da-skip" className="text-sm cursor-pointer">Ignorar</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="merge" id="da-merge" />
                  <Label htmlFor="da-merge" className="text-sm cursor-pointer">Mesclar (atualizar existente)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="new" id="da-new" />
                  <Label htmlFor="da-new" className="text-sm cursor-pointer">Importar como novo</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {preview.length > 0 && (
            <>
              <div className="text-sm font-medium">
                Prévia ({preview.length} contato{preview.length > 1 ? "s" : ""})
              </div>
              <div className="border rounded-md max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Telefone</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 200).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          {r._dup ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
                              Duplicado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-300">
                              Novo
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.phone || "-"}</td>
                        <td className="p-2">{r.email || "-"}</td>
                        <td className="p-2">
                          {r._dup ? (
                            <select
                              value={r._action}
                              onChange={(e) => setRowAction(i, e.target.value as DupAction)}
                              className="border rounded px-2 py-1 text-xs bg-background"
                            >
                              <option value="skip">Ignorar</option>
                              <option value="merge">Mesclar</option>
                              <option value="new">Importar como novo</option>
                            </select>
                          ) : (
                            <span className="text-xs text-muted-foreground">Importar</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 200 && (
                  <p className="text-xs text-muted-foreground p-2 text-center">
                    Mostrando 200 de {preview.length} registros
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>Cancelar</Button>
          <Button onClick={handleImport} disabled={!preview.length || importing}>
            {importing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importando...</> : `Importar ${preview.length || ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
