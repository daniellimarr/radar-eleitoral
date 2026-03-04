import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

export default function Backup() {
  const [selected, setSelected] = useState<Set<TableKey>>(new Set());
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backup de Dados</h1>
        <p className="text-muted-foreground">Exporte os dados do sistema em formato CSV</p>
      </div>

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
    </div>
  );
}
