import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save } from "lucide-react";
import {
  NPS_STATUS_LABELS,
  buildSlug,
  sanitizeSlug,
  type NpsStatus,
  type NpsSurvey,
} from "@/components/features/nps/npsTopics";

export interface NpsSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null | undefined;
  survey: NpsSurvey | null;
  onSaved: () => void;
}

interface FormState {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: NpsStatus;
  slug: string;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "rascunho",
  slug: "",
};


/** Formulário de criação/edição de pesquisa NPS. */
export function NpsSurveyDialog({ open, onOpenChange, tenantId, survey, onSaved }: NpsSurveyDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      survey
        ? {
            title: survey.title,
            description: survey.description ?? "",
            start_date: survey.start_date ?? "",
            end_date: survey.end_date ?? "",
            status: survey.status,
            slug: survey.slug,
          }
        : EMPTY,
    );
  }, [open, survey]);


  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o título da pesquisa.");
      return;
    }
    if (!tenantId) {
      toast.error("Gabinete não identificado. Recarregue a página.");
      return;
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      toast.error("A data de encerramento deve ser posterior à data de início.");
      return;
    }

    setSaving(true);
    try {
      // Slug personalizado é sanitizado; se ficar vazio, geramos um curto automático.
      const desired = sanitizeSlug(form.slug) || buildSlug(form.title);
      if (desired.length < 3) {
        toast.error("O link personalizado precisa ter ao menos 3 caracteres.");
        setSaving(false);
        return;
      }

      // Checagem de disponibilidade: o slug é público e precisa ser único.
      const { data: taken, error: checkError } = await supabase
        .from("nps_surveys")
        .select("id")
        .eq("slug", desired)
        .limit(1);
      if (checkError) throw checkError;
      if (taken?.length && taken[0].id !== survey?.id) {
        toast.error("Esse link já está em uso. Escolha outro.");
        setSaving(false);
        return;
      }

      // Datas vazias precisam virar null: string vazia quebra colunas date no Postgres.
      const payload = {
        tenant_id: tenantId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        slug: desired,
      };

      if (survey) {
        const { error } = await supabase.from("nps_surveys").update(payload).eq("id", survey.id);
        if (error) throw error;
        toast.success("Pesquisa atualizada!");
      } else {
        const { error } = await supabase.from("nps_surveys").insert(payload);
        if (error) throw error;
        toast.success("Pesquisa criada!");
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Não foi possível salvar: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{survey ? "Editar Pesquisa NPS" : "Nova Pesquisa NPS"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nps-title">Título da Pesquisa *</Label>
            <Input
              id="nps-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Pesquisa de Intenção de Voto — Outubro 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nps-slug">Link personalizado</Label>
            <div className="flex items-center gap-1 rounded-md border border-input bg-muted/40 px-2">
              <span className="shrink-0 text-xs text-muted-foreground">
                radar-eleitoral.lovable.app/p/
              </span>
              <Input
                id="nps-slug"
                className="border-0 bg-transparent px-1 focus-visible:ring-0"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
                onBlur={(e) => setForm((f) => ({ ...f, slug: sanitizeSlug(e.target.value) }))}
                placeholder="voto2026"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para gerar um link curto automático. Use apenas letras, números e hífen.
            </p>
          </div>


          <div className="space-y-2">
            <Label htmlFor="nps-desc">Descrição</Label>
            <Textarea
              id="nps-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Breve descrição exibida no topo do formulário público"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nps-start">Data de Início</Label>
              <Input
                id="nps-start"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nps-end">Data de Encerramento</Label>
              <Input
                id="nps-end"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nps-status">Status</Label>
            {/* select nativo: evita crash com tradução automática do navegador */}
            <select
              id="nps-status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NpsStatus }))}
            >
              {(Object.keys(NPS_STATUS_LABELS) as NpsStatus[]).map((s) => (
                <option key={s} value={s}>
                  {NPS_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">O formulário pergunta:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>De 0 a 10, qual a probabilidade de você votar em nosso candidato?</li>
              <li>Qual tema é mais importante para você?</li>
              <li>Nome, bairro e comentário (opcionais)</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
