import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";
import { formatCpf, formatPhone } from "@/lib/utils/formatters";

interface StepDadosPessoaisProps {
  form: any;
  updateForm: (field: string, value: any) => void;
  cpfValid: boolean | null;
  onCpfBlur: () => void;
}

const genderOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export function StepDadosPessoais({ form, updateForm, cpfValid, onCpfBlur }: StepDadosPessoaisProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome completo *</Label>
        <Input 
          value={form.name} 
          onChange={(e) => updateForm("name", e.target.value)} 
          placeholder="Seu nome completo" 
          className="h-11" 
          required 
        />
      </div>
      <div className="space-y-2">
        <Label>Apelido</Label>
        <Input 
          value={form.nickname} 
          onChange={(e) => updateForm("nickname", e.target.value)} 
          placeholder="Como prefere ser chamado" 
          className="h-11" 
        />
      </div>
      <div className="space-y-2">
        <Label>CPF *</Label>
        <Input
          value={form.cpf}
          onChange={(e) => updateForm("cpf", formatCpf(e.target.value))}
          onBlur={onCpfBlur}
          placeholder="000.000.000-00"
          maxLength={14}
          className="h-11"
          inputMode="numeric"
        />
        {cpfValid === true && (
          <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> CPF válido</p>
        )}
        {cpfValid === false && (
          <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> CPF inválido</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Sexo</Label>
          <Select value={form.gender} onValueChange={(v) => updateForm("gender", v)}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {genderOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nascimento</Label>
          <Input 
            type="date" 
            value={form.birth_date} 
            onChange={(e) => updateForm("birth_date", e.target.value)} 
            className="h-11" 
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Celular</Label>
        <Input
          value={form.phone}
          onChange={(e) => updateForm("phone", formatPhone(e.target.value))}
          placeholder="(00) 00000-0000"
          className="h-11"
          inputMode="tel"
        />
      </div>
      <div className="flex items-center gap-3 py-1">
        <Checkbox 
          checked={form.has_whatsapp} 
          onCheckedChange={(c) => updateForm("has_whatsapp", !!c)} 
          id="whats" 
        />
        <Label htmlFor="whats" className="text-sm">Este número tem WhatsApp</Label>
      </div>
    </div>
  );
}
