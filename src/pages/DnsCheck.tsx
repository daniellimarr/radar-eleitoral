import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Globe } from "lucide-react";

const LOVABLE_IP = "185.158.133.1";

interface DnsAnswer {
  name: string;
  type: number;
  TTL?: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

type CheckState = "idle" | "loading" | "ok" | "missing" | "error";

interface RecordCheck {
  label: string;
  state: CheckState;
  values: string[];
  detail?: string;
}

/** Consulta DNS público (Google DoH) — resolve fora do cache do navegador. */
async function resolveDns(name: string, type: "TXT" | "A"): Promise<DnsAnswer[]> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`Falha na consulta DNS (${res.status})`);
  const json = (await res.json()) as DnsResponse;
  return json.Answer ?? [];
}

const cleanTxt = (value: string) => value.replace(/^"|"$/g, "").trim();

export default function DnsCheck() {
  const [domain, setDomain] = useState("radareleitoral.net");
  const [checks, setChecks] = useState<RecordCheck[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    const target = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    if (!target) return;

    setRunning(true);
    setChecks([
      { label: `TXT _lovable.${target}`, state: "loading", values: [] },
      { label: `A ${target}`, state: "loading", values: [] },
      { label: `A www.${target}`, state: "loading", values: [] },
    ]);

    const results: RecordCheck[] = [];

    // 1. Registro de verificação TXT _lovable
    try {
      const answers = await resolveDns(`_lovable.${target}`, "TXT");
      const values = answers.map((a) => cleanTxt(a.data));
      const verify = values.filter((v) => v.toLowerCase().includes("lovable_verify"));
      results.push({
        label: `TXT _lovable.${target}`,
        state: verify.length > 0 ? "ok" : values.length > 0 ? "missing" : "missing",
        values: values.length > 0 ? values : [],
        detail:
          verify.length > 0
            ? "Registro de verificação propagado."
            : values.length > 0
              ? "Existe um TXT, mas sem o valor lovable_verify=..."
              : "Nenhum registro TXT encontrado em _lovable — ainda não propagou.",
      });
    } catch (err) {
      results.push({
        label: `TXT _lovable.${target}`,
        state: "error",
        values: [],
        detail: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }

    // 2 e 3. Registros A (raiz e www)
    for (const host of [target, `www.${target}`]) {
      try {
        const answers = await resolveDns(host, "A");
        const ips = answers.filter((a) => a.type === 1).map((a) => a.data);
        results.push({
          label: `A ${host}`,
          state: ips.includes(LOVABLE_IP) ? "ok" : "missing",
          values: ips,
          detail: ips.includes(LOVABLE_IP)
            ? `Apontando para o Lovable (${LOVABLE_IP}).`
            : ips.length > 0
              ? `Aponta para outro destino. Esperado: ${LOVABLE_IP}.`
              : "Nenhum registro A encontrado.",
        });
      } catch (err) {
        results.push({
          label: `A ${host}`,
          state: "error",
          values: [],
          detail: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    setChecks(results);
    setLastRun(new Date());
    setRunning(false);
  }, [domain]);

  useEffect(() => {
    void runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const txtOk = checks.find((c) => c.label.startsWith("TXT"))?.state === "ok";
  const allOk = checks.length > 0 && checks.every((c) => c.state === "ok");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Verificação de DNS
        </h1>
        <p className="text-muted-foreground text-sm">
          Consulta pública dos registros do domínio para confirmar a propagação do TXT <code>_lovable</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domínio</CardTitle>
          <CardDescription>Informe o domínio raiz, sem http:// e sem barras.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="meudominio.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") void runChecks();
            }}
          />
          <Button onClick={() => void runChecks()} disabled={running} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Verificar agora
          </Button>
        </CardContent>
      </Card>

      <Card className={allOk ? "border-emerald-500/50" : txtOk ? "border-primary/50" : undefined}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Resultado</span>
            {checks.length > 0 && !running && (
              <Badge variant={allOk ? "default" : "secondary"}>
                {allOk ? "Tudo propagado" : txtOk ? "TXT propagado" : "Pendente"}
              </Badge>
            )}
          </CardTitle>
          {lastRun && (
            <CardDescription>Última consulta: {lastRun.toLocaleTimeString("pt-BR")}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((check) => (
            <div key={check.label} className="rounded-md border p-3">
              <div className="flex items-start gap-2">
                {check.state === "loading" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
                ) : check.state === "ok" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-all">{check.label}</p>
                  {check.detail && <p className="text-sm text-muted-foreground">{check.detail}</p>}
                  {check.values.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {check.values.map((v) => (
                        <li key={v} className="text-xs font-mono break-all text-muted-foreground">
                          {v}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
          {checks.length === 0 && !running && (
            <p className="text-sm text-muted-foreground">Nenhuma verificação executada ainda.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">O que configurar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>A</strong> — Nome <code>@</code> e <code>www</code> → <code>{LOVABLE_IP}</code></p>
          <p>• <strong>TXT</strong> — Nome <code>_lovable</code> → valor <code>lovable_verify=...</code> exibido no painel de domínios do Lovable</p>
          <p>A propagação pode levar de alguns minutos até 72 horas. Use este painel para reconsultar sem depender do cache do navegador.</p>
        </CardContent>
      </Card>
    </div>
  );
}
