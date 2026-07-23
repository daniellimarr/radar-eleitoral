import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";

interface CheckResult {
  ok: boolean;
  configured_env?: string;
  base_url?: string;
  has_api_key?: boolean;
  api_key_preview?: string | null;
  reachable?: boolean;
  http_status?: number | null;
  detected_env?: "production" | "sandbox" | "unknown";
  account_name?: string | null;
  matches?: boolean;
  error?: string | null;
}

export default function AsaasEnvCheck() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CheckResult | null>(null);

  const check = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-check-env");
      if (error) throw error;
      setResult(data as CheckResult);
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  const env = result?.configured_env;
  const isProd = env === "production";
  const matches = result?.matches;

  return (
    <div className="container mx-auto max-w-3xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Verificação do Ambiente Asaas</h1>
          <p className="text-muted-foreground text-sm">
            Confirme se ASAAS_ENV e ASAAS_API_KEY apontam para o ambiente correto antes de criar cobranças.
          </p>
        </div>
        <Button variant="outline" onClick={check} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Reverificar</span>
        </Button>
      </div>

      {loading && !result && (
        <Card>
          <CardContent className="py-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Verificando...
          </CardContent>
        </Card>
      )}

      {result && !result.ok && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Falha na verificação</AlertTitle>
          <AlertDescription>{result.error || "Erro desconhecido"}</AlertDescription>
        </Alert>
      )}

      {result?.ok && (
        <>
          {matches ? (
            <Alert className="border-green-500/50 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">
                Ambiente {isProd ? "de PRODUÇÃO" : "de SANDBOX"} validado
              </AlertTitle>
              <AlertDescription>
                A chave carregada foi aceita pela API {isProd ? "de produção" : "de sandbox"} do Asaas.
                {result.account_name && <> Conta: <strong>{result.account_name}</strong>.</>}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuração inconsistente</AlertTitle>
              <AlertDescription>
                {!result.has_api_key && "ASAAS_API_KEY não está configurada. "}
                {result.has_api_key && !result.reachable && (
                  <>A API do Asaas rejeitou a chave (HTTP {result.http_status ?? "?"}). Provavelmente a chave não pertence ao ambiente <strong>{env}</strong>. {result.error && <>Detalhe: {result.error}</>}</>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="ASAAS_ENV configurado">
                <Badge variant={isProd ? "default" : "secondary"}>{env}</Badge>
              </Row>
              <Row label="URL base">
                <code className="text-xs bg-muted px-2 py-1 rounded">{result.base_url}</code>
              </Row>
              <Row label="ASAAS_API_KEY">
                {result.has_api_key ? (
                  <code className="text-xs bg-muted px-2 py-1 rounded">{result.api_key_preview}</code>
                ) : (
                  <Badge variant="destructive">não configurada</Badge>
                )}
              </Row>
              <Row label="Chave aceita pela API">
                {result.reachable ? (
                  <Badge className="bg-green-600 hover:bg-green-600">sim</Badge>
                ) : (
                  <Badge variant="destructive">não {result.http_status ? `(HTTP ${result.http_status})` : ""}</Badge>
                )}
              </Row>
              {result.account_name && (
                <Row label="Conta Asaas">
                  <span className="font-medium">{result.account_name}</span>
                </Row>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Se a chave não bater com o ambiente, atualize o segredo correspondente antes de gerar pagamentos reais.
          </p>
        </>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}
