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

const engagementOptions = [
  { value: "nao_trabalhado", label: "Não trabalhado" },
  { value: "em_contato", label: "Em contato" },
  { value: "engajado", label: "Engajado" },
  { value: "voto_confirmado", label: "Voto confirmado" },
];

const inputCls = "h-11 bg-white border-slate-200";
const labelCls = "text-xs font-semibold text-slate-700";

export const StepGeneralData = memo(({ form, updateField, leaders }: ContactFormProps) => {
  return (
    <div className="space-y-5 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Linha 1: Nome / Apelido / Liderança (Apelido) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <Label className={labelCls}>Nome *</Label>
          <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Apelido</Label>
          <Input value={form.nickname} onChange={(e) => updateField("nickname", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Liderança (Apelido)</Label>
          <Select value={form.leader_id || "none"} onValueChange={(v) => updateField("leader_id", v === "none" ? "" : v)}>
            <SelectTrigger className={inputCls}><SelectValue placeholder="Liderança" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {leaders.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.nickname || l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 2: Sexo / Zona / Seção / Local onde vota */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="space-y-1.5">
          <Label className={labelCls}>Sexo *</Label>
          <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
            <SelectTrigger className={inputCls}><SelectValue placeholder="SELECIONE" /></SelectTrigger>
            <SelectContent>
              {genderOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Zona</Label>
          <Input value={form.voting_zone} onChange={(e) => updateField("voting_zone", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Seção</Label>
          <Input value={form.voting_section} onChange={(e) => updateField("voting_section", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Local onde vota</Label>
          <Input value={form.voting_location} onChange={(e) => updateField("voting_location", e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Linha 3: Dt nasc / Liderança checkbox / Envolvimento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        <div className="space-y-1.5">
          <Label className={labelCls}>Dt. nasc.</Label>
          <Input type="date" value={form.birth_date} onChange={(e) => updateField("birth_date", e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-center gap-2 h-11">
          <Checkbox
            id="is_leader"
            checked={form.is_leader}
            onCheckedChange={(c) => updateField("is_leader", c)}
            className="h-5 w-5 rounded-full border-primary data-[state=checked]:bg-primary"
          />
          <Label htmlFor="is_leader" className="text-sm font-medium text-slate-700 cursor-pointer">Liderança</Label>
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Envolvimento</Label>
          <Select value={form.engagement} onValueChange={(v) => updateField("engagement", v)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              {engagementOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 4: Celular / Whats? */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        <div className="space-y-1.5">
          <Label className={labelCls}>Celular *</Label>
          <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputCls} placeholder="(00) 00000-0000" />
        </div>
        <div className="flex items-center gap-2 h-11">
          <Checkbox
            id="has_whatsapp"
            checked={form.has_whatsapp}
            onCheckedChange={(c) => updateField("has_whatsapp", c)}
            className="h-5 w-5 rounded-full border-primary data-[state=checked]:bg-primary"
          />
          <Label htmlFor="has_whatsapp" className="text-sm font-medium text-slate-700 cursor-pointer">Whats?</Label>
        </div>
      </div>
    </div>
  );
});

StepGeneralData.displayName = "StepGeneralData";
