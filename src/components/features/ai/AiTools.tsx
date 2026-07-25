import { useState } from "react";
import { Loader2, MessageSquare, Mic, PenLine, Share2, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AiResultPanel } from "@/components/features/ai/AiResultPanel";
import {
  DEMAND_AREAS,
  OBJECTIVE_OPTIONS,
  PROFILE_OPTIONS,
  SOCIAL_NETWORKS,
  SPEECH_DURATIONS,
  TONE_OPTIONS,
} from "@/components/features/ai/aiCatalog";
import { useAiTask } from "@/hooks/useAiTask";
import type { AiTask } from "@/lib/aiRouting";

type ToolId = "whatsapp_messages" | "speech" | "demand_reply" | "social_post";

/** Select nativo: evita o crash do Radix com a tradução automática do navegador. */
function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function AiTools() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const { output, model, isRunning, error, run, cancel } = useAiTask();

  const [wa, setWa] = useState({ perfil: PROFILE_OPTIONS[0], objetivo: OBJECTIVE_OPTIONS[0], tom: TONE_OPTIONS[0], contexto: "" });
  const [speech, setSpeech] = useState({ evento: "", local: "", temas: "", duracao: SPEECH_DURATIONS[1] });
  const [demand, setDemand] = useState({ eleitor: "", bairro: "", area: DEMAND_AREAS[0], demanda: "" });
  const [post, setPost] = useState({ rede: SOCIAL_NETWORKS[0], objetivo: OBJECTIVE_OPTIONS[0], tema: "" });

  const execute = (tool: ToolId, params: Record<string, string>) => {
    setActiveTool(tool);
    void run(tool as AiTask, params, "speed");
  };

  const result = (tool: ToolId) =>
    activeTool === tool && (output || isRunning || error) ? (
      <AiResultPanel output={output} isRunning={isRunning} error={error} model={model} onCancel={cancel} />
    ) : null;

  const busy = (tool: ToolId) => isRunning && activeTool === tool;
  const Spin = ({ tool }: { tool: ToolId }) =>
    busy(tool) ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkle className="mr-1 h-4 w-4" />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Mensagens de WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            Gerador de Mensagens WhatsApp
          </CardTitle>
          <p className="text-sm text-muted-foreground">3 opções de mensagem por perfil de eleitor</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <NativeSelect value={wa.perfil} onChange={(v) => setWa({ ...wa, perfil: v })} options={PROFILE_OPTIONS} />
            <NativeSelect value={wa.objetivo} onChange={(v) => setWa({ ...wa, objetivo: v })} options={OBJECTIVE_OPTIONS} />
            <NativeSelect value={wa.tom} onChange={(v) => setWa({ ...wa, tom: v })} options={TONE_OPTIONS} />
          </div>
          <Input
            placeholder="Contexto adicional (opcional)"
            value={wa.contexto}
            maxLength={500}
            onChange={(e) => setWa({ ...wa, contexto: e.target.value })}
          />
          <Button disabled={isRunning} onClick={() => execute("whatsapp_messages", wa)}>
            <Spin tool="whatsapp_messages" />
            Gerar 3 opções
          </Button>
          {result("whatsapp_messages")}
        </CardContent>
      </Card>

      {/* Roteiro de discurso */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="h-4 w-4 text-primary" />
            Roteiro de Discurso
            <Badge variant="secondary">Novo</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Discurso personalizado para qualquer evento</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Tipo de evento (ex: reunião de bairro)" value={speech.evento} maxLength={120} onChange={(e) => setSpeech({ ...speech, evento: e.target.value })} />
          <Input placeholder="Local / Bairro" value={speech.local} maxLength={120} onChange={(e) => setSpeech({ ...speech, local: e.target.value })} />
          <Input placeholder="Temas (ex: saneamento, segurança)" value={speech.temas} maxLength={200} onChange={(e) => setSpeech({ ...speech, temas: e.target.value })} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <NativeSelect value={speech.duracao} onChange={(v) => setSpeech({ ...speech, duracao: v })} options={SPEECH_DURATIONS} />
            <Button className="sm:w-auto" disabled={isRunning || !speech.evento.trim()} onClick={() => execute("speech", speech)}>
              <Spin tool="speech" />
              Gerar roteiro
            </Button>
          </div>
          {result("speech")}
        </CardContent>
      </Card>

      {/* Resposta para demandas */}
      <Card className="border-l-4 border-l-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenLine className="h-4 w-4 text-primary" />
            Resposta para Demandas
            <Badge variant="secondary">Novo</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Cole a demanda do eleitor e a IA sugere 3 respostas</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input placeholder="Nome do eleitor" value={demand.eleitor} maxLength={80} onChange={(e) => setDemand({ ...demand, eleitor: e.target.value })} />
            <Input placeholder="Bairro" value={demand.bairro} maxLength={80} onChange={(e) => setDemand({ ...demand, bairro: e.target.value })} />
            <NativeSelect value={demand.area} onChange={(v) => setDemand({ ...demand, area: v })} options={DEMAND_AREAS} />
          </div>
          <Textarea placeholder="Texto da demanda do eleitor..." value={demand.demanda} maxLength={1500} rows={3} onChange={(e) => setDemand({ ...demand, demanda: e.target.value })} />
          <Button disabled={isRunning || !demand.demanda.trim()} onClick={() => execute("demand_reply", demand)}>
            <Spin tool="demand_reply" />
            Sugerir resposta com IA
          </Button>
          {result("demand_reply")}
        </CardContent>
      </Card>

      {/* Post para redes */}
      <Card className="border-l-4 border-l-warning">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" />
            Criador de Post para Redes
            <Badge variant="secondary">Novo</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Gera texto e hashtags para Instagram, Facebook e X</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <NativeSelect value={post.rede} onChange={(v) => setPost({ ...post, rede: v })} options={SOCIAL_NETWORKS} />
            <NativeSelect value={post.objetivo} onChange={(v) => setPost({ ...post, objetivo: v })} options={OBJECTIVE_OPTIONS} />
          </div>
          <Input placeholder="Tema ou contexto do post" value={post.tema} maxLength={300} onChange={(e) => setPost({ ...post, tema: e.target.value })} />
          <Button disabled={isRunning || !post.tema.trim()} onClick={() => execute("social_post", post)}>
            <Spin tool="social_post" />
            Criar post
          </Button>
          {result("social_post")}
        </CardContent>
      </Card>
    </div>
  );
}

export default AiTools;
