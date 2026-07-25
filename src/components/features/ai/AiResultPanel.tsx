import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getModelSpec } from "@/lib/aiRouting";
import { cn } from "@/lib/utils";

export interface AiResultPanelProps {
  output: string;
  isRunning: boolean;
  error: string | null;
  model: string | null;
  onCancel?: () => void;
  className?: string;
}

/** Exibe o resultado de uma tarefa de IA com markdown, badge do modelo e cópia. */
export function AiResultPanel({
  output,
  isRunning,
  error,
  model,
  onCancel,
  className,
}: AiResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard bloqueado pelo navegador: ignora silenciosamente */
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!output && !isRunning) return null;

  const spec = model ? getModelSpec(model) : undefined;

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-4", className)}>
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>
            {isRunning ? "Gerando análise..." : "Gerado por"}{" "}
            {spec ? <strong className="text-foreground">{spec.label}</strong> : null}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isRunning && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <StopCircle className="mr-1 h-4 w-4" />
              Parar
            </Button>
          )}
          {!isRunning && output && (
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          )}
        </div>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none break-words">
        <ReactMarkdown>{output || "..."}</ReactMarkdown>
      </div>
    </div>
  );
}

export default AiResultPanel;
