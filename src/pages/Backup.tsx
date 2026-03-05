import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Database, Loader2, Upload, FileUp, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";

const EXPORT_TABLES = [
  { key: "contacts", label: "Contatos", description: "Todos os contatos cadastrados" },
  { key: "demands", label: "Demandas", description: "Demandas e solicitações" },
  { key: "appointments", label: "Agenda", description: "Compromissos e eventos" },
  { key: "leaders", label: "Lideranças", description: "Lideranças cadastradas" },
  { key: "vehicles", label: "Veículos", description: "Frota de veículos" },
  { key: "campaign_materials", label: "Materiais de Campanha", description: "Materiais disponíveis" },
  { key: "donations", label: "Doações", description: "Doações recebidas" },
  { key: "expenses", label: "Despesas", description: "Despesas registradas" },
  { key: "visit_requests", label: "Solicitações de Visita", description: "Pedidos de visita" },
  { key: "campaigns", label: "Campanhas", description: "Campanhas eleitorais" },
  { key: "suppliers", label: "Fornecedores", description: "Fornecedores cadastrados" },
  { key: "voter_interactions", label: "Interações com Eleitores", description: "Histórico de interações" },
] as const;

type TableKey = typeof EXPORT_TABLES[number]["key"];

function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
}

// Columns that should be excluded from import (auto-generated)
const AUTO_COLUMNS = new Set(["id", "created_at", "updated_at", "deleted_at"]);

// Excel column mapping for contacts import
const EXCEL_COLUMN_MAP: Record<string, string> = {};
const COLUMN_ALIASES: Record<string, string[]> = {
  name: ["nome", "nome completo", "nome_completo", "full name", "nome do contato", "contato"],
  phone: ["telefone", "celular", "tel", "fone", "phone", "whatsapp", "numero", "número"],
  address: ["endereco", "endereço", "logradouro", "rua", "end"],
  neighborhood: ["bairro", "neighborhood"],
  city: ["cidade", "municipio", "município", "city"],
  state: ["estado", "uf", "state"],
  cep: ["cep", "zip", "codigo postal", "código postal"],
  email: ["email", "e-mail", "correio"],
  cpf: ["cpf", "documento", "doc"],
  nickname: ["apelido", "nickname"],
  observations: ["observacoes", "observações", "obs", "notas", "observacao", "observação"],
  gender: ["genero", "gênero", "sexo", "gender"],
  birth_date: ["nascimento", "data nascimento", "data_nascimento", "birth_date", "aniversario", "aniversário"],
  voting_zone: ["zona", "zona eleitoral", "zona_eleitoral"],
  voting_section: ["secao", "seção", "secao eleitoral", "seção eleitoral"],
  voting_location: ["local votacao", "local votação", "local_votacao"],
  address_number: ["numero endereço", "numero endereco", "nº", "num", "numero_endereco"],
};

function normalizeStr(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\-]/g, " ");
}

function mapExcelHeaderToField(header: string): string | null {
  const normalized = normalizeStr(header);
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(a => normalizeStr(a) === normalized || normalized.includes(normalizeStr(a)))) {
      return field;
    }
  }
  return null;
}

interface ExcelImportPreview {
  rows: Record<string, string>[];
  mappedHeaders: { original: string; mapped: string | null }[];
  fileName: string;
}

interface ImportPreview {
  rows: Record<string, string>[];
  headers: string[];
  fileName: string;
}

export default function Backup() {
  const [selected, setSelected] = useState<Set<TableKey>>(new Set());
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Import state
  const [importTable, setImportTable] = useState<TableKey | "">("");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel import state
  const [excelPreview, setExcelPreview] = useState<ExcelImportPreview | null>(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelProgress, setExcelProgress] = useState(0);
  const [excelResult, setExcelResult] = useState<{ success: number; errors: number } | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const toggleTable = (key: TableKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === EXPORT_TABLES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(EXPORT_TABLES.map(t => t.key)));
    }
  };

  const handleExport = async () => {
    if (!selected.size) {
      toast({ title: "Selecione ao menos uma tabela", variant: "destructive" });
      return;
    }

    setLoading(true);
    let exported = 0;

    try {
      for (const key of selected) {
        const { data, error } = await supabase.from(key).select("*");
        if (error) {
          toast({ title: `Erro ao exportar ${key}`, description: error.message, variant: "destructive" });
          continue;
        }
        if (data && data.length > 0) {
          const csv = convertToCSV(data as Record<string, unknown>[]);
          const date = new Date().toISOString().slice(0, 10);
          downloadCSV(csv, `backup_${key}_${date}.csv`);
          exported++;
        } else {
          toast({ title: `${key}`, description: "Nenhum dado encontrado", variant: "default" });
        }
      }

      if (exported > 0) {
        toast({ title: "Backup concluído", description: `${exported} arquivo(s) exportado(s) com sucesso` });
      }
    } catch (err) {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({ title: "Formato inválido", description: "Selecione um arquivo CSV", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      if (!rows.length) {
        toast({ title: "Arquivo vazio", description: "O arquivo não contém dados para importar", variant: "destructive" });
        return;
      }
      const headers = Object.keys(rows[0]);
      setImportPreview({ rows, headers, fileName: file.name });
      setImportResult(null);
    };
    reader.readAsText(file, "UTF-8");

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!importTable || !importPreview) return;

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    let success = 0;
    let errors = 0;
    const batchSize = 50;
    const rows = importPreview.rows;

    // Filter out auto-generated columns
    const cleanRows = rows.map(row => {
      const clean: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (AUTO_COLUMNS.has(key)) continue;
        // Convert empty strings to null
        clean[key] = value === "" ? null : value;
      }
      // Add tenant_id from profile if the table requires it and it's not in the CSV
      if (profile?.tenant_id && !clean.tenant_id) {
        clean.tenant_id = profile.tenant_id;
      }
      return clean;
    });

    for (let i = 0; i < cleanRows.length; i += batchSize) {
      const batch = cleanRows.slice(i, i + batchSize);
      const { error } = await supabase.from(importTable).insert(batch as any[]);
      if (error) {
        errors += batch.length;
      } else {
        success += batch.length;
      }
      setImportProgress(Math.round(((i + batch.length) / cleanRows.length) * 100));
    }

    setImporting(false);
    setImportResult({ success, errors });
    toast({
      title: "Importação concluída",
      description: `${success} registros importados, ${errors} com erro`,
      variant: errors > 0 ? "destructive" : "default",
    });
  };

  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls"];
    if (!validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast({ title: "Formato inválido", description: "Selecione um arquivo Excel (.xlsx ou .xls)", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

        if (!jsonData.length) {
          toast({ title: "Planilha vazia", description: "A planilha não contém dados", variant: "destructive" });
          return;
        }

        const originalHeaders = Object.keys(jsonData[0]);
        const mappedHeaders = originalHeaders.map(h => ({
          original: h,
          mapped: mapExcelHeaderToField(h),
        }));

        const rows = jsonData.map(row => {
          const obj: Record<string, string> = {};
          originalHeaders.forEach(h => {
            obj[h] = row[h] !== undefined && row[h] !== null ? String(row[h]).trim() : "";
          });
          return obj;
        });

        setExcelPreview({ rows, mappedHeaders, fileName: file.name });
        setExcelResult(null);
      } catch (err) {
        toast({ title: "Erro ao ler planilha", description: "Não foi possível processar o arquivo", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    if (excelInputRef.current) excelInputRef.current.value = "";
  };

  const handleExcelImport = async () => {
    if (!excelPreview || !profile?.tenant_id) return;

    setExcelImporting(true);
    setExcelProgress(0);
    setExcelResult(null);

    const mappedFields = excelPreview.mappedHeaders.filter(h => h.mapped !== null);
    if (!mappedFields.some(h => h.mapped === "name")) {
      toast({ title: "Coluna obrigatória ausente", description: "A planilha precisa ter uma coluna de NOME", variant: "destructive" });
      setExcelImporting(false);
      return;
    }

    const cleanRows = excelPreview.rows.map(row => {
      const contact: Record<string, unknown> = { tenant_id: profile.tenant_id };
      for (const { original, mapped } of mappedFields) {
        if (!mapped) continue;
        const value = row[original];
        contact[mapped] = value === "" ? null : value;
      }
      return contact;
    }).filter(r => r.name); // Skip rows without name

    let success = 0;
    let errors = 0;
    const batchSize = 50;

    for (let i = 0; i < cleanRows.length; i += batchSize) {
      const batch = cleanRows.slice(i, i + batchSize);
      const { error } = await supabase.from("contacts").insert(batch as any[]);
      if (error) {
        console.error("Import batch error:", error);
        errors += batch.length;
      } else {
        success += batch.length;
      }
      setExcelProgress(Math.round(((i + batch.length) / cleanRows.length) * 100));
    }

    setExcelImporting(false);
    setExcelResult({ success, errors });
    toast({
      title: "Importação concluída",
      description: `${success} contatos importados, ${errors} com erro`,
      variant: errors > 0 ? "destructive" : "default",
    });
  };

  const tableLabel = (key: string) => EXPORT_TABLES.find(t => t.key === key)?.label ?? key;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backup de Dados</h1>
        <p className="text-muted-foreground">Exporte ou importe dados do sistema em formato CSV ou Excel</p>
      </div>

      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar CSV
          </TabsTrigger>
          <TabsTrigger value="excel" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Importar Planilha
          </TabsTrigger>
        </TabsList>

        {/* EXPORT TAB */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Selecione as tabelas para exportar
              </CardTitle>
              <CardDescription>
                Os dados serão baixados em arquivos CSV separados por tabela
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={selected.size === EXPORT_TABLES.length}
                  onCheckedChange={selectAll}
                />
                <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                  Selecionar todas
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EXPORT_TABLES.map(table => (
                  <div
                    key={table.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected.has(table.key) ? "bg-accent border-primary" : "hover:bg-muted"
                    }`}
                    onClick={() => toggleTable(table.key)}
                  >
                    <Checkbox
                      checked={selected.has(table.key)}
                      onCheckedChange={() => toggleTable(table.key)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{table.label}</p>
                      <p className="text-xs text-muted-foreground">{table.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleExport} disabled={loading || !selected.size} size="lg">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Exportando..." : `Exportar ${selected.size} tabela(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMPORT TAB */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Importar dados de arquivo CSV
              </CardTitle>
              <CardDescription>
                Selecione a tabela de destino e o arquivo CSV para importar. Use arquivos exportados pelo próprio sistema para melhores resultados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Select table */}
              <div className="space-y-2">
                <Label className="font-semibold">1. Selecione a tabela de destino</Label>
                <Select value={importTable} onValueChange={(v) => setImportTable(v as TableKey)}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Escolha uma tabela..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_TABLES.map(t => (
                      <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Upload file */}
              <div className="space-y-2">
                <Label className="font-semibold">2. Selecione o arquivo CSV</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!importTable}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar arquivo
                  </Button>
                  {importPreview && (
                    <span className="text-sm text-muted-foreground">
                      {importPreview.fileName} — {importPreview.rows.length} registros encontrados
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Step 3: Preview */}
              {importPreview && (
                <div className="space-y-3">
                  <Label className="font-semibold">3. Pré-visualização dos dados</Label>
                  <div className="rounded-lg border">
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {importPreview.headers.map(h => (
                              <TableHead key={h} className="whitespace-nowrap">
                                {h}
                                {AUTO_COLUMNS.has(h) && (
                                  <Badge variant="secondary" className="ml-1 text-xs">auto</Badge>
                                )}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importPreview.rows.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              {importPreview.headers.map(h => (
                                <TableCell key={h} className="text-xs max-w-[200px] truncate">
                                  {row[h] || <span className="text-muted-foreground italic">vazio</span>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                  {importPreview.rows.length > 10 && (
                    <p className="text-xs text-muted-foreground">
                      Exibindo 10 de {importPreview.rows.length} registros
                    </p>
                  )}
                </div>
              )}

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={importProgress} />
                  <p className="text-sm text-muted-foreground">Importando... {importProgress}%</p>
                </div>
              )}

              {/* Result */}
              {importResult && (
                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  {importResult.errors === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {importResult.success} registros importados com sucesso
                    </p>
                    {importResult.errors > 0 && (
                      <p className="text-sm text-destructive">
                        {importResult.errors} registros com erro
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Import button */}
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleImport}
                  disabled={importing || !importTable || !importPreview}
                  size="lg"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {importing ? "Importando..." : `Importar para ${importTable ? tableLabel(importTable) : "..."}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXCEL IMPORT TAB */}
        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importar Contatos de Planilha Excel
              </CardTitle>
              <CardDescription>
                Envie uma planilha Excel (.xlsx ou .xls) com colunas como NOME, TELEFONE, ENDEREÇO e o sistema organizará automaticamente nos cadastros de contatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Upload */}
              <div className="space-y-2">
                <Label className="font-semibold">1. Selecione a planilha Excel</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => excelInputRef.current?.click()}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Selecionar planilha
                  </Button>
                  {excelPreview && (
                    <span className="text-sm text-muted-foreground">
                      {excelPreview.fileName} — {excelPreview.rows.length} registros encontrados
                    </span>
                  )}
                </div>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelFileSelect}
                />
                <p className="text-xs text-muted-foreground">
                  Colunas reconhecidas automaticamente: Nome, Telefone, Endereço, Bairro, Cidade, Estado, CEP, E-mail, CPF, Apelido, Observações, Gênero, Data de Nascimento, Zona Eleitoral, Seção
                </p>
              </div>

              {/* Step 2: Mapping preview */}
              {excelPreview && (
                <div className="space-y-3">
                  <Label className="font-semibold">2. Mapeamento de colunas</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {excelPreview.mappedHeaders.map(({ original, mapped }) => (
                      <div key={original} className={`flex items-center gap-2 p-2 rounded border text-sm ${mapped ? "bg-accent/50 border-primary/30" : "bg-muted/30 border-border"}`}>
                        <span className="font-medium truncate">{original}</span>
                        <span className="text-muted-foreground">→</span>
                        {mapped ? (
                          <Badge variant="default" className="text-xs">{mapped}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">ignorado</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Data preview */}
              {excelPreview && (
                <div className="space-y-3">
                  <Label className="font-semibold">3. Pré-visualização dos dados</Label>
                  <div className="rounded-lg border">
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {excelPreview.mappedHeaders.filter(h => h.mapped).map(h => (
                              <TableHead key={h.original} className="whitespace-nowrap">{h.mapped}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {excelPreview.rows.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              {excelPreview.mappedHeaders.filter(h => h.mapped).map(h => (
                                <TableCell key={h.original} className="text-xs max-w-[200px] truncate">
                                  {row[h.original] || <span className="text-muted-foreground italic">vazio</span>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                  {excelPreview.rows.length > 10 && (
                    <p className="text-xs text-muted-foreground">
                      Exibindo 10 de {excelPreview.rows.length} registros
                    </p>
                  )}
                </div>
              )}

              {/* Progress */}
              {excelImporting && (
                <div className="space-y-2">
                  <Progress value={excelProgress} />
                  <p className="text-sm text-muted-foreground">Importando... {excelProgress}%</p>
                </div>
              )}

              {/* Result */}
              {excelResult && (
                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  {excelResult.errors === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {excelResult.success} contatos importados com sucesso
                    </p>
                    {excelResult.errors > 0 && (
                      <p className="text-sm text-destructive">
                        {excelResult.errors} registros com erro
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Import button */}
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleExcelImport}
                  disabled={excelImporting || !excelPreview || !excelPreview.mappedHeaders.some(h => h.mapped === "name")}
                  size="lg"
                >
                  {excelImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  {excelImporting ? "Importando..." : "Importar para Contatos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
