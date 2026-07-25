import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { classifyScore, calcNps, type NpsResponse } from "@/components/features/nps/npsTopics";

export interface NpsSurveyResultsProps {
  responses: NpsResponse[];
}

/** Resultados consolidados de uma pesquisa: NPS, distribuição, temas e comentários. */
export function NpsSurveyResults({ responses }: NpsSurveyResultsProps) {
  const stats = useMemo(() => {
    const scores = responses.map((r) => r.score);
    const total = scores.length;
    const avg = total ? scores.reduce((a, b) => a + b, 0) / total : 0;
    const groups = { promotor: 0, neutro: 0, detrator: 0 };
    for (const s of scores) groups[classifyScore(s)] += 1;

    const topics = new Map<string, number>();
    for (const r of responses) {
      if (!r.main_topic) continue;
      topics.set(r.main_topic, (topics.get(r.main_topic) ?? 0) + 1);
    }

    return {
      total,
      avg,
      nps: calcNps(scores),
      groups,
      topics: [...topics.entries()].sort((a, b) => b[1] - a[1]),
      comments: responses.filter((r) => (r.comment ?? "").trim().length > 0).slice(0, 20),
    };
  }, [responses]);

  if (stats.total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma resposta recebida ainda. Compartilhe o link com sua base para começar a coletar.
      </p>
    );
  }

  const pct = (n: number) => Math.round((n / stats.total) * 100);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Respostas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.avg.toFixed(1).replace(".", ",")} / 10</p>
            <p className="text-xs text-muted-foreground">Nota média</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.nps > 0 ? `+${stats.nps}` : stats.nps}</p>
            <p className="text-xs text-muted-foreground">NPS (−100 a 100)</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {(
          [
            ["Promotores (9-10)", stats.groups.promotor],
            ["Neutros (7-8)", stats.groups.neutro],
            ["Detratores (0-6)", stats.groups.detrator],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">
                {value} · {pct(value)}%
              </span>
            </div>
            <Progress value={pct(value)} />
          </div>
        ))}
      </div>

      {stats.topics.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Temas prioritários</p>
          <div className="flex flex-wrap gap-2">
            {stats.topics.map(([topic, count]) => (
              <Badge key={topic} variant="secondary">
                {topic} · {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {stats.comments.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Comentários recentes</p>
          <ul className="space-y-2">
            {stats.comments.map((c) => (
              <li key={c.id} className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <p className="text-foreground">{c.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nota {c.score}
                  {c.respondent_name ? ` · ${c.respondent_name}` : ""}
                  {c.neighborhood ? ` · ${c.neighborhood}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
