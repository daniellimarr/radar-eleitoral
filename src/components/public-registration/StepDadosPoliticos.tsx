import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepDadosPoliticosProps {
  form: any;
  updateForm: (field: string, value: any) => void;
}

const engagementOptions = [
  { value: "nao_trabalhado", label: "Não trabalhado" },
  { value: "em_prospeccao", label: "Em prospecção" },
  { value: "conquistado", label: "Conquistado" },
  { value: "criando_envolvimento", label: "Criando envolvimento" },
  { value: "falta_trabalhar", label: "Falta trabalhar" },
  { value: "envolvimento_perdido", label: "Envolvimento perdido" },
];

export function StepDadosPoliticos({ form, updateForm }: StepDadosPoliticosProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Envolvimento</Label>
        <Select value={form.engagement} onValueChange={(v) => updateForm("engagement", v)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {engagementOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Zona</Label>
          <Input 
            value={form.voting_zone} 
            onChange={(e) => updateForm("voting_zone", e.target.value)} 
            placeholder="000" 
            className="h-11" 
          />
        </div>
        <div className="space-y-2">
          <Label>Seção</Label>
          <Input 
            value={form.voting_section} 
            onChange={(e) => updateForm("voting_section", e.target.value)} 
            placeholder="000" 
            className="h-11" 
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Local de Votação</Label>
        <Input 
          value={form.voting_location} 
          onChange={(e) => updateForm("voting_location", e.target.value)} 
          placeholder="Nome da escola ou local" 
          className="h-11" 
        />
      </div>
    </div>
  );
}
