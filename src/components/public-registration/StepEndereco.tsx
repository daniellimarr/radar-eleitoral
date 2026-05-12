import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCep } from "@/lib/utils/formatters";

interface StepEnderecoProps {
  form: any;
  updateForm: (field: string, value: any) => void;
  geocoding: boolean;
  onCepBlur: () => void;
}

export function StepEndereco({ form, updateForm, geocoding, onCepBlur }: StepEnderecoProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CEP {geocoding && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
        <Input
          value={form.cep}
          onChange={(e) => updateForm("cep", formatCep(e.target.value))}
          onBlur={onCepBlur}
          placeholder="00000-000"
          className="h-11"
          inputMode="numeric"
        />
      </div>
      <div className="space-y-2">
        <Label>Logradouro</Label>
        <Input 
          value={form.address} 
          onChange={(e) => updateForm("address", e.target.value)} 
          placeholder="Rua, Av..." 
          className="h-11" 
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Número</Label>
          <Input 
            value={form.address_number} 
            onChange={(e) => updateForm("address_number", e.target.value)} 
            placeholder="Nº" 
            className="h-11" 
            inputMode="numeric" 
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Bairro</Label>
          <Input 
            value={form.neighborhood} 
            onChange={(e) => updateForm("neighborhood", e.target.value)} 
            className="h-11" 
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2 col-span-2">
          <Label>Cidade</Label>
          <Input 
            value={form.city} 
            onChange={(e) => updateForm("city", e.target.value)} 
            className="h-11" 
          />
        </div>
        <div className="space-y-2">
          <Label>UF</Label>
          <Input 
            value={form.state} 
            onChange={(e) => updateForm("state", e.target.value)} 
            maxLength={2} 
            className="h-11" 
          />
        </div>
      </div>
    </div>
  );
}
