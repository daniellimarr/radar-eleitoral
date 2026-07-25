import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, ExternalLink, Loader2, AlertTriangle, Info } from "lucide-react";

const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export interface ImportTseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ImportTseDialog({ open, onOpenChange, onImported }: ImportTseDialogProps) {
  const [uf, setUf] = useState("RR");
  const [city, setCity] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const runImport = async (payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-tse", { body: payload });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falha na importação.");
      toast.success(
        `${data.imported.toLocaleString("pt-BR")} seções importadas · ${data.zones} zonas · ${Number(data.voters).toLocaleString("pt-BR")} eleitores`,
      );
      onImported();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAuto = () =>
    runImport({ mode: "auto", uf, city: city.trim() || undefined, replace: replaceExisting });

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    // Arquivos do TSE costumam vir em ISO-8859-1
    let text = new TextDecoder("iso-8859-1").decode(buffer);
    if (!text.includes(";") && !text.includes(",")) {
      text = new TextDecoder("utf-8").decode(buffer);
    }
    await runImport({
      mode: "csv",
      uf,
      city: city.trim() || undefined,
      replace: replaceExisting,
      csv: text,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Importar dados do TSE
          </DialogTitle>
          <DialogDescription>
            Baixe as zonas e seções eleitorais direto do Portal de Dados Abertos do TSE.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tse-uf">Estado (UF)</Label>
              <select
                id="tse-uf"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tse-city">Filtrar por município (opcional)</Label>
              <Input
                id="tse-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Boa Vista — vazio importa todos"
              />
              <p className="text-xs text-muted-foreground">
                Recomendado para estados grandes, que possuem milhares de seções.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="tse-replace"
                checked={replaceExisting}
                onCheckedChange={(v) => setReplaceExisting(v === true)}
              />
              <Label htmlFor="tse-replace" className="text-sm font-normal">
                Limpar seções existentes antes de importar
              </Label>
            </div>

            <Button className="w-full" onClick={handleAuto} disabled={loading}>
              {loading
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Download className="h-4 w-4 mr-2" />}
              Baixar e importar do TSE
            </Button>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Importação manual (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Se a importação automática falhar, baixe o CSV do TSE e envie aqui.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open("https://dadosabertos.tse.jus.br/dataset/", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Portal de Dados Abertos do TSE
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={() => fileRef.current?.click()}
                >
                  Importar CSV manualmente
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> O que será importado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Zonas e seções eleitorais</p>
                  <p className="text-xs text-muted-foreground">
                    Número da zona, número da seção e total de eleitores aptos.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Local de votação</p>
                  <p className="text-xs text-muted-foreground">
                    Nome do local, bairro e endereço, quando disponíveis no arquivo.
                  </p>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Votos históricos não são incluídos — preencha a meta e os votos da última
                    eleição manualmente em cada seção.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Atenção</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>O download pode levar de 30s a 2min (arquivos de 5–50MB).</li>
                  <li>Seções já cadastradas são atualizadas com os dados mais recentes.</li>
                  <li>Os contatos são cruzados automaticamente por zona e seção.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImportTseDialog;
