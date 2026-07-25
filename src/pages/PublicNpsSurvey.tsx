import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NPS_TOPICS, type NpsSurvey } from "@/components/features/nps/npsTopics";

/** Formulário público de pesquisa NPS acessado via link (/pesquisa/:slug). */
export default function PublicNpsSurvey() {
  const { slug } = useParams<{ slug: string }>();
  const [survey, setSurvey] = useState<NpsSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [form, setForm] = useState({ main_topic: "", respondent_name: "", neighborhood: "", comment: "" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!slug) return;
      const { data, error } = await supabase.rpc("get_public_nps_survey", { p_slug: slug });
      if (!active) return;
      if (error) {
        toast.error("Não foi possível carregar a pesquisa.");
      }
      const rows = (data ?? []) as unknown as NpsSurvey[];
      setSurvey(rows[0] ?? null);

      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  const withinPeriod = useMemo(() => {
    if (!survey) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (survey.start_date && survey.start_date > today) return false;
    if (survey.end_date && survey.end_date < today) return false;
    return true;
  }, [survey]);

  const handleSubmit = async () => {
    if (!survey) return;
    if (score === null) {
      toast.error("Escolha uma nota de 0 a 10.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("nps_responses").insert({
        survey_id: survey.id,
        tenant_id: survey.tenant_id,
        score,
        main_topic: form.main_topic || null,
        respondent_name: form.respondent_name.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        comment: form.comment.trim() || null,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Não foi possível enviar sua resposta: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Carregando pesquisa...</p>
      </main>
    );
  }

  if (!survey || !withinPeriod) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-2 p-8 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Pesquisa indisponível</h1>
            <p className="text-sm text-muted-foreground">
              Esta pesquisa não está aberta para respostas neste momento.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-2 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-lg font-semibold">Resposta enviada!</h1>
            <p className="text-sm text-muted-foreground">
              Muito obrigado pela sua participação. Sua opinião nos ajuda a construir propostas melhores.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-8">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">{survey.title}</CardTitle>
          {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>De 0 a 10, qual a probabilidade de você votar em nosso candidato? *</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  aria-label={`Nota ${n}`}
                  aria-pressed={score === n}
                  className={cn(
                    "h-11 w-11 rounded-md border border-input text-sm font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    score === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">0 = nada provável · 10 = com certeza votaria</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Qual tema é mais importante para você?</Label>
            <select
              id="topic"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.main_topic}
              onChange={(e) => setForm((f) => ({ ...f, main_topic: e.target.value }))}
            >
              <option value="">Selecione um tema</option>
              {NPS_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome (opcional)</Label>
              <Input
                id="name"
                value={form.respondent_name}
                onChange={(e) => setForm((f) => ({ ...f, respondent_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro (opcional)</Label>
              <Input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário ou sugestão (opcional)</Label>
            <Textarea
              id="comment"
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Conte o que é mais importante para o seu bairro"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar resposta"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
