import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Appointments() {
  const { tenantId, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start_time: "", end_time: "", location: "" });
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("appointments").select("*").eq("tenant_id", tenantId).order("start_time", { ascending: true });
    setAppointments(data || []);
  };

  useEffect(() => { fetchAppointments(); }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId || !form.title || !form.start_time) { toast.error("Título e data são obrigatórios"); return; }
    setLoading(true);
    const { error } = await supabase.from("appointments").insert({
      ...form, tenant_id: tenantId, created_by: user?.id,
      end_time: form.end_time || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Compromisso adicionado!"); setIsOpen(false); setForm({ title: "", description: "", start_time: "", end_time: "", location: "" }); fetchAppointments(); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Compromisso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Compromisso</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Início *</Label><Input type="datetime-local" value={form.start_time} onChange={(e) => setForm(p => ({ ...p, start_time: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="datetime-local" value={form.end_time} onChange={(e) => setForm(p => ({ ...p, end_time: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Local</Label><Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} /></div>
              <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Salvando..." : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum compromisso agendado</CardContent></Card>
        ) : appointments.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{a.title}</h3>
                {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(a.start_time), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  {a.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.location}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
