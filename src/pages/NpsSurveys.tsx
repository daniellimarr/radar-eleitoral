import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNpsSurveys, useNpsResponses } from "@/hooks/useNps";
import { NpsSurveyDialog } from "@/components/features/nps/NpsSurveyDialog";
import { NpsSurveyResults } from "@/components/features/nps/NpsSurveyResults";
import { calcNps, NPS_STATUS_LABELS, type NpsSurvey } from "@/components/features/nps/npsTopics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  BarChart3, Plus, Copy, MessageCircle, ExternalLink, Pencil, Trash2, ChevronDown, Star, Users,
} from "lucide-react";

/** Painel de Pesquisa de Opinião (NPS Político). */
export default function NpsSurveys() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const { data: surveys = [], isLoading } = useNpsSurveys(tenantId);
  const { data: responses = [] } = useNpsResponses(tenantId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NpsSurvey | null>(null);

  const totals = useMemo(() => {
    const scores = responses.map((r) => r.score);
    return {
      surveys: surveys.length,
      responses: responses.length,
      avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      nps: calcNps(scores),
    };
  }, [surveys, responses]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["nps-surveys"] });
    queryClient.invalidateQueries({ queryKey: ["nps-responses"] });
  };

  // Sempre o domínio publicado: a URL de preview exige login do Lovable.
  const publicUrl = (slug: string) => `https://radar-eleitoral.lovable.app/p/${slug}`;



  const shareMessage = (survey: NpsSurvey) =>
    `Olá! 👋 Sua opinião é muito importante para nós.\n\n` +
    `Responda em 1 minuto a pesquisa "${survey.title}":\n\n🔗 ${publicUrl(survey.slug)}\n\n` +
    `São apenas 3 perguntas rápidas. Obrigado pela sua participação! 🙏`;

  const handleCopy = async (survey: NpsSurvey) => {
    try {
      await navigator.clipboard.writeText(shareMessage(survey));
      toast.success("Mensagem com o link copiada!");
    } catch {
      toast.error("Não foi possível copiar. Copie o link manualmente.");
    }
  };

  const handleDelete = async (survey: NpsSurvey) => {
    if (!window.confirm(`Excluir a pesquisa "${survey.title}" e todas as suas respostas?`)) return;
    const { error } = await supabase.from("nps_surveys").delete().eq("id", survey.id);
    if (error) {
      toast.error(`Erro ao excluir: ${error.message}`);
      return;
    }
    toast.success("Pesquisa excluída.");
    refresh();
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pesquisa de Opinião (NPS Político)</h1>
            <p className="text-sm text-muted-foreground">
              Envie o link para sua base e acompanhe intenção de voto e temas prioritários
            </p>
          </div>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova Pesquisa
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {(
          [
            [<BarChart3 key="i" className="h-5 w-5 text-primary" />, String(totals.surveys), "Pesquisas"],
            [<Users key="i" className="h-5 w-5 text-primary" />, String(totals.responses), "Respostas Total"],
            [
              <Star key="i" className="h-5 w-5 text-accent" />,
              `${totals.avg.toFixed(1).replace(".", ",")} / 10`,
              "Nota Média Geral",
            ],
            [
              <BarChart3 key="i" className="h-5 w-5 text-accent" />,
              totals.nps > 0 ? `+${totals.nps}` : String(totals.nps),
              "NPS Consolidado",
            ],
          ] as const
        ).map(([icon, value, label]) => (
          <Card key={label}>
            <CardContent className="p-5">
              {icon}
              <p className="mt-3 text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Carregando pesquisas...
          </CardContent>
        </Card>
      ) : surveys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">Nenhuma pesquisa criada ainda</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Crie uma pesquisa e compartilhe o link com eleitores para coletar intenção de voto e temas
              prioritários.
            </p>
            <Button
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Criar Primeira Pesquisa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => {
            const surveyResponses = responses.filter((r) => r.survey_id === survey.id);
            return (
              <Card key={survey.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold">{survey.title}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={survey.status === "ativa" ? "default" : "secondary"}>
                          {NPS_STATUS_LABELS[survey.status]}
                        </Badge>
                        {survey.start_date && <span>{survey.start_date.split("-").reverse().slice(0, 2).join("/")}</span>}
                        {survey.end_date && <span>— {survey.end_date.split("-").reverse().slice(0, 2).join("/")}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{surveyResponses.length}</p>
                      <p className="text-xs text-muted-foreground">respostas</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
                    <span className="flex-1 truncate text-xs text-muted-foreground">{publicUrl(survey.slug)}</span>
                    <Button size="icon" variant="outline" onClick={() => handleCopy(survey)} aria-label="Copiar link">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" aria-label="Compartilhar no WhatsApp" asChild>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareMessage(survey))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setEditing(survey);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <a href={publicUrl(survey.slug)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Abrir Formulário
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto gap-2 text-destructive"
                      onClick={() => handleDelete(survey)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-2">
                        <ChevronDown className="h-4 w-4" />
                        Ver resultados
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <NpsSurveyResults responses={surveyResponses} />
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NpsSurveyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenantId={tenantId}
        survey={editing}
        onSaved={refresh}
      />
    </div>
  );
}
