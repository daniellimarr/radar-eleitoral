import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiResultPanel } from "@/components/features/ai/AiResultPanel";
import { ANALYSES, type AnalysisDefinition } from "@/components/features/ai/aiCatalog";
import { useAiTask } from "@/hooks/useAiTask";
import { cn } from "@/lib/utils";
import type { AiTask } from "@/lib/aiRouting";

/** Painel de análises geradas por IA a partir dos dados agregados do gabinete. */
export function AiAnalyses() {
  const [activeTask, setActiveTask] = useState<AiTask | null>(null);
  const { output, model, isRunning, error, run, cancel } = useAiTask();

  const generate = (definition: AnalysisDefinition) => {
    setActiveTask(definition.task);
    void run(definition.task);
  };

  const renderCard = (definition: AnalysisDefinition) => {
    const isActive = activeTask === definition.task;
    return (
      <Card key={definition.task} className={cn(definition.accent)}>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {definition.title}
              {definition.featured && <Badge variant="secondary">Destaque</Badge>}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
          </div>
          <Button size="sm" onClick={() => generate(definition)} disabled={isRunning}>
            {isRunning && isActive ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1 h-4 w-4" />
            )}
            Gerar
          </Button>
        </CardHeader>
        {isActive && (output || isRunning || error) && (
          <CardContent>
            <AiResultPanel
              output={output}
              isRunning={isRunning}
              error={error}
              model={model}
              onCancel={cancel}
            />
          </CardContent>
        )}
      </Card>
    );
  };

  const featured = ANALYSES.filter((item) => item.featured);
  const rest = ANALYSES.filter((item) => !item.featured);

  return (
    <div className="space-y-4">
      {featured.map(renderCard)}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{rest.map(renderCard)}</div>
    </div>
  );
}

export default AiAnalyses;
