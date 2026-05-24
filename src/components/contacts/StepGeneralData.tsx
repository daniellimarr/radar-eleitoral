import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactFormProps {
  form: any;
  updateField: (field: string, value: any) => void;
  leaders: any[];
}

const genderOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];


export const StepGeneralData = memo(({ form, updateField, leaders }: ContactFormProps) => {
  return (
    <div className="space-y-4 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Nome Completo *</Label>
          <Input 
            value={form.name} 
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Digite o nome completo"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Apelido</Label>
          <Input 
            value={form.nickname} 
            onChange={(e) => updateField("nickname", e.target.value)}
            placeholder="Como é conhecido?"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sexo</Label>
          <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o sexo" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Data de Nascimento</Label>
          <Input 
            type="date" 
            value={form.birth_date} 
            onChange={(e) => updateField("birth_date", e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Telefone / Celular</Label>
          <Input 
            value={form.phone} 
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <Checkbox 
            id="has_whatsapp" 
            checked={form.has_whatsapp}
            onCheckedChange={(c) => updateField("has_whatsapp", c)}
          />
          <Label htmlFor="has_whatsapp" className="text-sm font-medium">Possui WhatsApp?</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Vincular a uma Liderança</Label>
          <Select 
            value={form.leader_id || "none"} 
            onValueChange={(v) => updateField("leader_id", v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a liderança" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem liderança</SelectItem>
              {leaders.map((leader) => (
                <SelectItem key={leader.id} value={leader.id}>
                  {leader.nickname || leader.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <Checkbox 
            id="is_leader" 
            checked={form.is_leader}
            onCheckedChange={(c) => updateField("is_leader", c)}
          />
          <Label htmlFor="is_leader" className="text-sm font-medium">Este contato é uma liderança?</Label>
        </div>
      </div>
    </div>
  );
});

StepGeneralData.displayName = "StepGeneralData";
