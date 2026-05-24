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
    <div className="space-y-5 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
        <div className="space-y-1.5 md:col-span-1">
          <Label className={`${labelCls} flex items-center gap-2`}>
            CEP {geocoding && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </Label>
          <Input
            value={form.cep}
            onChange={(e) => updateField("cep", e.target.value)}
            onBlur={handleCepBlur}
            className={inputCls}
            placeholder="00000-000"
          />
        </div>
        <div className="space-y-1.5 md:col-span-4">
          <Label className={labelCls}>Logradouro</Label>
          <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <Label className={labelCls}>Número</Label>
          <Input value={form.address_number} onChange={(e) => updateField("address_number", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <Label className={labelCls}>Bairro</Label>
          <Input value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>Cidade</Label>
          <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className={labelCls}>UF</Label>
          <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} className={inputCls} maxLength={2} />
        </div>
      </div>
    </div>
  );
});

StepAddress.displayName = "StepAddress";
