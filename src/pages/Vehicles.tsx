import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";

export default function Vehicles() {
  const { tenantId } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ plate: "", model: "", brand: "", year: "", color: "", driver_name: "", driver_phone: "", observations: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const fetch = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("vehicles").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setVehicles(data || []);
  };

  useEffect(() => { fetch(); }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId || !form.plate) { toast.error("Placa é obrigatória"); return; }
    setLoading(true);
    const payload = { ...form, tenant_id: tenantId, year: form.year ? parseInt(form.year) : null };
    if (editingId) {
      await supabase.from("vehicles").update(payload).eq("id", editingId);
      toast.success("Veículo atualizado!");
    } else {
      await supabase.from("vehicles").insert(payload);
      toast.success("Veículo cadastrado!");
    }
    setLoading(false); setIsOpen(false); setEditingId(null);
    setForm({ plate: "", model: "", brand: "", year: "", color: "", driver_name: "", driver_phone: "", observations: "" });
    fetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vehicles").delete().eq("id", id);
    toast.success("Veículo removido"); fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <div className="flex gap-2">
          <ExportButtons tableRef={tableRef} title="Veículos" filename="veiculos" />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setForm({ plate: "", model: "", brand: "", year: "", color: "", driver_name: "", driver_phone: "", observations: "" }); }}>
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
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead><TableHead>Modelo</TableHead><TableHead>Marca</TableHead><TableHead>Motorista</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum veículo</TableCell></TableRow>
              ) : vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.plate}</TableCell>
                  <TableCell>{v.model}</TableCell>
                  <TableCell>{v.brand}</TableCell>
                  <TableCell>{v.driver_name}</TableCell>
                  <TableCell className="capitalize">{v.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setForm({ plate: v.plate, model: v.model || "", brand: v.brand || "", year: v.year?.toString() || "", color: v.color || "", driver_name: v.driver_name || "", driver_phone: v.driver_phone || "", observations: v.observations || "" }); setEditingId(v.id); setIsOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
