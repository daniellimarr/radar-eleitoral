import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone, Users, Calendar, Fingerprint } from "lucide-react";

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
    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome Completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={form.name} 
              onChange={(e) => updateField("name", e.target.value)} 
              className="pl-10 h-11 bg-white border-slate-200 focus:ring-primary"
              placeholder="Ex: João da Silva"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Apelido / Como gosta de ser chamado</Label>
          <Input 
            value={form.nickname} 
            onChange={(e) => updateField("nickname", e.target.value)} 
            className="h-11 bg-white border-slate-200"
            placeholder="Ex: Joãozinho"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefone Celular</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={form.phone} 
              onChange={(e) => updateField("phone", e.target.value)} 
              className="pl-10 h-11 bg-white border-slate-200"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gênero</Label>
          <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
            <SelectTrigger className="h-11 bg-white border-slate-200">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Data de Nascimento</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              type="date"
              value={form.birth_date} 
              onChange={(e) => updateField("birth_date", e.target.value)} 
              className="pl-10 h-11 bg-white border-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">CPF</Label>
          <div className="relative">
            <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={form.cpf} 
              onChange={(e) => updateField("cpf", e.target.value)} 
              className="pl-10 h-11 bg-white border-slate-200"
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Vínculo com Liderança</Label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
            <Select value={form.leader_id} onValueChange={(v) => updateField("leader_id", v === "none" ? "" : v)}>
              <SelectTrigger className="pl-10 h-11 bg-white border-slate-200">
                <SelectValue placeholder="Selecione a liderança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (Direto)</SelectItem>
                {leaders.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.nickname || l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <Checkbox 
          checked={form.has_whatsapp} 
          onCheckedChange={(c) => updateField("has_whatsapp", c)} 
          id="whats_form"
          className="h-5 w-5 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
        <Label htmlFor="whats_form" className="text-sm font-semibold text-slate-700 cursor-pointer">
          Este número possui WhatsApp? (Ativar para automações)
        </Label>
      </div>
    </div>
  );
});

StepGeneralData.displayName = "StepGeneralData";
