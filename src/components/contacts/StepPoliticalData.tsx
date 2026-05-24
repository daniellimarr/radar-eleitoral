import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vote, Target, Landmark } from "lucide-react";

interface StepPoliticalDataProps {
  form: any;
  updateField: (field: string, value: any) => void;
}

const engagementOptions = [
  { value: "nao_trabalhado", label: "Não trabalhado" },
  { value: "em_prospeccao", label: "Em prospecção" },
  { value: "conquistado", label: "Conquistado" },
  { value: "criando_envolvimento", label: "Criando envolvimento" },
  { value: "falta_trabalhar", label: "Falta trabalhar" },
  { value: "envolvimento_perdido", label: "Envolvimento perdido" },
];

export const StepPoliticalData = memo(({ form, updateField }: StepPoliticalDataProps) => {
  return (
    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Target className="h-3.5 w-3.5" /> Status de Engajamento / Termômetro
        </Label>
        <Select value={form.engagement} onValueChange={(v) => updateField("engagement", v)}>
          <SelectTrigger className="h-12 bg-white border-slate-200 text-base font-medium">
            <SelectValue placeholder="Selecione o nível de apoio" />
          </SelectTrigger>
          <SelectContent>
            {engagementOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} className="font-medium">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-slate-400 font-medium px-1">
          Define como este contato será contabilizado nas metas e projeções de votos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Vote className="h-3.5 w-3.5" /> Zona Eleitoral
          </Label>
          <Input 
            value={form.voting_zone} 
            onChange={(e) => updateField("voting_zone", e.target.value)} 
            placeholder="Ex: 001" 
            className="h-11 bg-white border-slate-200" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Vote className="h-3.5 w-3.5" /> Seção Eleitoral
          </Label>
          <Input 
            value={form.voting_section} 
            onChange={(e) => updateField("voting_section", e.target.value)} 
            placeholder="Ex: 0123" 
            className="h-11 bg-white border-slate-200" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Landmark className="h-3.5 w-3.5" /> Local de Votação (Escola / Prédio)
        </Label>
        <Input 
          value={form.voting_location} 
          onChange={(e) => updateField("voting_location", e.target.value)} 
          placeholder="Nome da escola, associação ou clube" 
          className="h-11 bg-white border-slate-200" 
        />
      </div>
    </div>
  );
});

StepPoliticalData.displayName = "StepPoliticalData";
