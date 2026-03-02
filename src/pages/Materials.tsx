import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const materialTypes = ["Banner", "Panfleto", "Adesivo", "Santinho", "Camiseta", "Boné", "Bandeira", "Outro"];

export default function Materials() {
  const { tenantId } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "", quantity: "0", storage_location: "", observations: "" });
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("campaign_materials").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setMaterials(data || []);
  };

  useEffect(() => { fetch(); }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId || !form.name || !form.type) { toast.error("Nome e tipo são obrigatórios"); return; }
    setLoading(true);
    await supabase.from("campaign_materials").insert({ ...form, quantity: parseInt(form.quantity) || 0, tenant_id: tenantId });
    toast.success("Material cadastrado!");
    setLoading(false); setIsOpen(false);
    setForm({ name: "", type: "", quantity: "0", storage_location: "", observations: "" });
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Material de Campanha</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Material</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Material</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{materialTypes.map(t => <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Local de armazenamento</Label><Input value={form.storage_location} onChange={(e) => setForm(p => ({ ...p, storage_location: e.target.value }))} /></div>
              <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Salvando..." : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Qtd Total</TableHead><TableHead>Distribuído</TableHead><TableHead>Local</TableHead><TableHead className="w-16">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum material</TableCell></TableRow>
              ) : materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="capitalize">{m.type}</TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell>{m.quantity_distributed}</TableCell>
                  <TableCell>{m.storage_location}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("campaign_materials").delete().eq("id", m.id); fetch(); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
