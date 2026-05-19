import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVehicles } from "@/hooks/vehicles/useVehicles";
import { VehicleService } from "@/services/vehicles/VehicleService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { VehicleTable } from "@/components/vehicles/VehicleTable";

const defaultForm = { plate: "", model: "", brand: "", year: "", color: "", driver_name: "", driver_phone: "", observations: "" };

export default function Vehicles() {
  const { tenantId } = useAuth();
  const { vehicles, loading: vehiclesLoading, refresh, deleteVehicle } = useVehicles(tenantId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleSave = async () => {
    if (!tenantId || !form.plate) { toast.error("Placa é obrigatória"); return; }
    setLoading(true);
    const payload = { ...form, tenant_id: tenantId, year: form.year ? parseInt(form.year) : null };
    
    const { error } = await VehicleService.saveVehicle(payload, editingId);
    if (error) toast.error(error.message);
    else {
      toast.success(editingId ? "Veículo atualizado!" : "Veículo cadastrado!");
      setIsOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      refresh();
    }
    setLoading(false);
  };

  const handleEdit = (v: any) => {
    setForm({ 
      plate: v.plate, 
      model: v.model || "", 
      brand: v.brand || "", 
      year: v.year?.toString() || "", 
      color: v.color || "", 
      driver_name: v.driver_name || "", 
      driver_phone: v.driver_phone || "", 
      observations: v.observations || "" 
    });
    setEditingId(v.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <div className="flex gap-2">
          <ExportButtons tableRef={tableRef} title="Veículos" filename="veiculos" />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); setForm(defaultForm); }}>
                <Plus className="h-4 w-4 mr-2" /> Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Veículo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Placa *</Label><Input value={form.plate} onChange={(e) => setForm(p => ({ ...p, plate: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Modelo</Label><Input value={form.model} onChange={(e) => setForm(p => ({ ...p, model: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm(p => ({ ...p, brand: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Ano</Label><Input value={form.year} onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Cor</Label><Input value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Motorista</Label><Input value={form.driver_name} onChange={(e) => setForm(p => ({ ...p, driver_name: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Tel. Motorista</Label><Input value={form.driver_phone} onChange={(e) => setForm(p => ({ ...p, driver_phone: e.target.value }))} /></div>
                <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Salvando..." : "Salvar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <VehicleTable 
            vehicles={vehicles}
            onEdit={handleEdit}
            onDelete={deleteVehicle}
            tableRef={tableRef}
          />
        </CardContent>
      </Card>
    </div>
  );
}
