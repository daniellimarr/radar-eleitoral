import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MAIN_TENANT } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";

// Field aliases (Portuguese headers -> internal fields)
const FIELD_MAP: Record<string, string> = {
  nome: "name", "nome completo": "name", name: "name",
  apelido: "nickname", nickname: "nickname",
  sexo: "gender", genero: "gender", gênero: "gender",
  "data de nascimento": "birth_date", nascimento: "birth_date", "data_nascimento": "birth_date",
  telefone: "phone", celular: "phone", whatsapp: "phone", fone: "phone",
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

interface Row {
  [key: string]: any;
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
    // Group items by y coordinate to reconstruct lines
    const byLine: Record<number, string[]> = {};
    for (const it of content.items as any[]) {
      const y = Math.round(it.transform[5]);
      (byLine[y] ??= []).push(it.str);
    }
    Object.keys(byLine)
      .sort((a, b) => Number(b) - Number(a))
      .forEach(y => lines.push(byLine[Number(y)].join(" ").trim()));
  }
  // Heuristic: first non-empty line is header (comma or tab or 2+ spaces separated)
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
  const headers = ["nome", "apelido", "sexo", "data de nascimento", "telefone", "cep", "endereco", "numero", "bairro", "cidade", "estado"];
  const example = ["João da Silva", "Joãozinho", "M", "1985-03-15", "95991234567", "69300000", "Rua Exemplo", "100", "Centro", "Boa Vista", "RR"];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contatos");
  XLSX.writeFile(wb, "modelo-importacao-contatos.xlsx");
}

export function ImportContactsDialog() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");

  const effectiveTenantId = tenantId || MAIN_TENANT;

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
      setPreview(rows);
      toast.success(`${rows.length} contato(s) reconhecido(s)`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao ler arquivo");
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  };

  const handleImport = async () => {
    if (!preview.length || !user) return;
    setImporting(true);
    let ok = 0, fail = 0;
    const batchSize = 50;
    for (let i = 0; i < preview.length; i += batchSize) {
      const batch = preview.slice(i, i + batchSize).map(r => ({
        name: String(r.name),
        ...r,
        tenant_id: effectiveTenantId,
        registered_by: user.id,
        city: r.city || "Boa Vista",
        state: r.state || "RR",
        engagement: "nao_trabalhado" as const,
      }));
      const { error, data } = await supabase.from("contacts").insert(batch).select("id");
      if (error) { fail += batch.length; console.error(error); }
      else ok += data?.length || 0;
    }
    setImporting(false);
    if (ok) toast.success(`${ok} contato(s) importado(s)!`);
    if (fail) toast.error(`${fail} contato(s) falharam`);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription>
            Envie um arquivo Excel (.xlsx), CSV ou PDF. A coluna <strong>nome</strong> é obrigatória.
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

          {preview.length > 0 && (
            <>
              <div className="text-sm font-medium">Prévia ({preview.length} contato{preview.length > 1 ? "s" : ""})</div>
              <div className="border rounded-md max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Telefone</th>
                      <th className="p-2 text-left">Cidade</th>
                      <th className="p-2 text-left">Bairro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 100).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.phone || "-"}</td>
                        <td className="p-2">{r.city || "-"}</td>
                        <td className="p-2">{r.neighborhood || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 100 && (
                  <p className="text-xs text-muted-foreground p-2 text-center">
                    Mostrando 100 de {preview.length} registros
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
