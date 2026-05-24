import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Home, Search, Loader2 } from "lucide-react";

interface StepAddressProps {
  form: any;
  updateField: (field: string, value: any) => void;
  geocoding: boolean;
  handleCepBlur: () => void;
}

export const StepAddress = memo(({ form, updateField, geocoding, handleCepBlur }: StepAddressProps) => {
  return (
    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            CEP {geocoding && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={form.cep} 
              onChange={(e) => updateField("cep", e.target.value)} 
              onBlur={handleCepBlur} 
              className="pl-10 h-11 bg-white border-slate-200"
              placeholder="00000-000"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Logradouro / Endereço</Label>
          <div className="relative">
            <Home className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={form.address} 
              onChange={(e) => updateField("address", e.target.value)} 
              className="pl-10 h-11 bg-white border-slate-200"
              placeholder="Rua, Avenida, etc."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Número</Label>
          <Input 
            value={form.address_number} 
            onChange={(e) => updateField("address_number", e.target.value)} 
            className="h-11 bg-white border-slate-200"
            placeholder="Nº"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bairro</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              value={form.neighborhood} 
              onChange={(e) => updateField("neighborhood", e.target.value)} 
              className="pl-10 h-11 bg-white border-slate-200"
              placeholder="Ex: Centro"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cidade</Label>
          <Input 
            value={form.city} 
            onChange={(e) => updateField("city", e.target.value)} 
            className="h-11 bg-white border-slate-200"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado (UF)</Label>
          <Input 
            value={form.state} 
            onChange={(e) => updateField("state", e.target.value)} 
            className="h-11 bg-white border-slate-200"
            maxLength={2}
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <Navigation className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-blue-900">Geolocalização Inteligente</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Ao preencher o CEP e o número, o sistema tenta localizar automaticamente as coordenadas para exibição no mapa territorial.
          </p>
        </div>
      </div>
    </div>
  );
});

StepAddress.displayName = "StepAddress";
