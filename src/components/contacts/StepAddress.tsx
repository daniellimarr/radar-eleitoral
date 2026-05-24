import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface StepAddressProps {
  form: any;
  updateField: (field: string, value: any) => void;
  geocoding: boolean;
  handleCepBlur: () => void;
}

const inputCls = "h-11 bg-white border-slate-200";
const labelCls = "text-xs font-semibold text-slate-700";

export const StepAddress = memo(({ form, updateField, geocoding, handleCepBlur }: StepAddressProps) => {
  return (
    <div className="space-y-4 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            CEP
            {geocoding && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </Label>
          <Input 
            value={form.cep} 
            onChange={(e) => updateField("cep", e.target.value)}
            onBlur={handleCepBlur}
            placeholder="00000-000"
          />
        </div>
        <div className="space-y-2">
          <Label>Logradouro</Label>
          <Input 
            value={form.address} 
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Rua, Avenida, etc."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Número</Label>
          <Input 
            value={form.address_number} 
            onChange={(e) => updateField("address_number", e.target.value)}
            placeholder="123"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Bairro</Label>
          <Input 
            value={form.neighborhood} 
            onChange={(e) => updateField("neighborhood", e.target.value)}
            placeholder="Digite o bairro"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input 
            value={form.city} 
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Boa Vista"
          />
        </div>
        <div className="space-y-2">
          <Label>Estado (UF)</Label>
          <Input 
            value={form.state} 
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="RR"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
});

StepAddress.displayName = "StepAddress";
