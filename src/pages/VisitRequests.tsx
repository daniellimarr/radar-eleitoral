import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function VisitRequests() {
  const { tenantId, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", requested_date: "", location: "",
    chairs_needed: "0", needs_political_material: false, needs_banners: false,
    needs_sound: false, material_observations: "",
  });
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("visit_requests").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setRequests(data || []);
  };

  useEffect(() => { fetch(); }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId || !form.title) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    await supabase.from("visit_requests").insert({
      ...form, tenant_id: tenantId, requested_by: user?.id,
      chairs_needed: parseInt(form.chairs_needed) || 0,
      requested_date: form.requested_date || null,
    });
    toast.success("Solicitação enviada!");
    setLoading(false); setIsOpen(false);
    setForm({ title: "", description: "", requested_date: "", location: "", chairs_needed: "0", needs_political_material: false, needs_banners: false, needs_sound: false, material_observations: "" });
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitações de Visita / Reunião</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Solicitação</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Solicitar Visita / Reunião</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data/Hora</Label><Input type="datetime-local" value={form.requested_date} onChange={(e) => setForm(p => ({ ...p, requested_date: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Local</Label><Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Total de cadeiras necessárias</Label><Input type="number" value={form.chairs_needed} onChange={(e) => setForm(p => ({ ...p, chairs_needed: e.target.value }))} /></div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Necessidades</Label>
                <div className="flex items-center gap-2"><Checkbox checked={form.needs_political_material} onCheckedChange={(c) => setForm(p => ({ ...p, needs_political_material: !!c }))} /><span className="text-sm">Material político</span></div>
                <div className="flex items-center gap-2"><Checkbox checked={form.needs_banners} onCheckedChange={(c) => setForm(p => ({ ...p, needs_banners: !!c }))} /><span className="text-sm">Banners</span></div>
                <div className="flex items-center gap-2"><Checkbox checked={form.needs_sound} onCheckedChange={(c) => setForm(p => ({ ...p, needs_sound: !!c }))} /><span className="text-sm">Som</span></div>
              </div>
              <div className="space-y-2"><Label>Observações sobre material</Label><Textarea value={form.material_observations} onChange={(e) => setForm(p => ({ ...p, material_observations: e.target.value }))} /></div>
              <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Enviando..." : "Enviar Solicitação"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead><TableHead>Data</TableHead><TableHead>Local</TableHead><TableHead>Cadeiras</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma solicitação</TableCell></TableRow>
              ) : requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.requested_date ? new Date(r.requested_date).toLocaleDateString("pt-BR") : "-"}</TableCell>
                  <TableCell>{r.location || "-"}</TableCell>
                  <TableCell>{r.chairs_needed}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "aprovado" ? "default" : r.status === "rejeitado" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
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
