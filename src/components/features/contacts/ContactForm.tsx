import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { GENDER_OPTIONS, ENGAGEMENT_OPTIONS } from "@/constants/options";

interface ContactFormProps {
  form: any;
  updateField: (field: string, value: any) => void;
  handleCepBlur: () => void;
  geocoding: boolean;
  isOperador: boolean;
  profileName?: string;
  leaders: any[];
}

export function ContactForm({ 
  form, 
  updateField, 
  handleCepBlur, 
  geocoding, 
  isOperador, 
  profileName, 
  leaders 
}: ContactFormProps) {
  return (
    <Tabs defaultValue="dados" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="dados">Dados gerais</TabsTrigger>
        <TabsTrigger value="endereco">Endereço</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Apelido</Label>
            <Input value={form.nickname} onChange={(e) => updateField("nickname", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Liderança (Apelido)</Label>
            {isOperador ? (
              <Input value={profileName || "Liderança"} disabled />
            ) : (
              <Select value={form.leader_id || "none"} onValueChange={(v) => updateField("leader_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {leaders.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.nickname || l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Sexo *</Label>
            <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
              <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Zona</Label>
            <Input value={form.voting_zone} onChange={(e) => updateField("voting_zone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Seção</Label>
            <Input value={form.voting_section} onChange={(e) => updateField("voting_section", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Local onde vota</Label>
            <Input value={form.voting_location} onChange={(e) => updateField("voting_location", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Dt. nasc.</Label>
            <Input type="date" value={form.birth_date || ""} onChange={(e) => updateField("birth_date", e.target.value || null)} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox checked={form.is_leader} onCheckedChange={(c) => updateField("is_leader", c)} id="leader" />
            <Label htmlFor="leader">Liderança</Label>
          </div>
          <div className="space-y-2">
            <Label>Envolvimento</Label>
            <Select value={form.engagement} onValueChange={(v) => updateField("engagement", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENGAGEMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Celular *</Label>
            <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox checked={form.has_whatsapp} onCheckedChange={(c) => updateField("has_whatsapp", c)} id="whats" />
            <Label htmlFor="whats">Whats?</Label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="endereco" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>CEP {geocoding && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
            <Input value={form.cep} onChange={(e) => updateField("cep", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Logradouro</Label>
            <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input value={form.address_number} onChange={(e) => updateField("address_number", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
