import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Users, Volume2, Flag, Armchair, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Appointments() {
  const { tenantId, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [visitRequests, setVisitRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start_time: "", end_time: "", location: "" });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!tenantId) return;
    const [apptRes, visitRes] = await Promise.all([
      supabase.from("appointments").select("*").eq("tenant_id", tenantId).order("start_time", { ascending: true }),
      supabase.from("visit_requests").select("*").eq("tenant_id", tenantId).order("requested_date", { ascending: true }),
    ]);
    setAppointments(apptRes.data || []);
    setVisitRequests(visitRes.data || []);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId || !form.title || !form.start_time) { toast.error("Título e data são obrigatórios"); return; }
    setLoading(true);
    const { error } = await supabase.from("appointments").insert({
      ...form, tenant_id: tenantId, created_by: user?.id,
      end_time: form.end_time || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Compromisso adicionado!"); setIsOpen(false); setForm({ title: "", description: "", start_time: "", end_time: "", location: "" }); fetchData(); }
    setLoading(false);
  };

  const handleComplete = async (id: string, type: "appointment" | "visit") => {
    if (type === "visit") {
      const { error } = await supabase.from("visit_requests").update({ status: "concluido" }).eq("id", id);
      if (error) toast.error(error.message);
      else { toast.success("Visita concluída!"); fetchData(); }
    }
  };

  // Merge both into a unified timeline — exclude completed visits
  const activeVisits = visitRequests.filter((v) => v.status !== "concluido");
  const allEvents = [
    ...appointments.map((a) => ({ ...a, type: "appointment" as const, date: a.start_time })),
    ...activeVisits.map((v) => ({ ...v, type: "visit" as const, date: v.requested_date })),
  ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

  const statusColor = (status: string) => {
    switch (status) {
      case "aprovado": return "default";
      case "pendente": return "secondary";
      case "rejeitado": return "destructive";
      default: return "outline";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pendente": return "Pendente";
      case "aprovado": return "Aprovado";
      case "rejeitado": return "Rejeitado";
      case "cancelado": return "Cancelado";
      default: return status;
    }
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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({allEvents.length})</TabsTrigger>
          <TabsTrigger value="appointments">Compromissos ({appointments.length})</TabsTrigger>
          <TabsTrigger value="visits">Visitas ({activeVisits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <EventList events={allEvents} statusColor={statusColor} statusLabel={statusLabel} onComplete={handleComplete} />
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          <EventList events={allEvents.filter(e => e.type === "appointment")} statusColor={statusColor} statusLabel={statusLabel} onComplete={handleComplete} />
        </TabsContent>
        <TabsContent value="visits" className="mt-4">
          <EventList events={allEvents.filter(e => e.type === "visit")} statusColor={statusColor} statusLabel={statusLabel} onComplete={handleComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventList({ events, statusColor, statusLabel, onComplete }: { events: any[]; statusColor: (s: string) => any; statusLabel: (s: string) => string; onComplete: (id: string, type: "appointment" | "visit") => void }) {
  if (events.length === 0) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum evento na agenda</CardContent></Card>;
  }

  return (
    <div className="grid gap-4">
      {events.map((e) => (
        <Card key={`${e.type}-${e.id}`}>
          <CardContent className="flex items-start gap-4 p-4">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${e.type === "visit" ? "bg-orange-500/10" : "bg-primary/10"}`}>
              {e.type === "visit" ? <Users className="h-6 w-6 text-orange-600" /> : <CalendarIcon className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{e.title}</h3>
                <Badge variant={e.type === "visit" ? "outline" : "secondary"} className="text-xs">
                  {e.type === "visit" ? "Visita" : "Compromisso"}
                </Badge>
                {e.type === "visit" && e.status && (
                  <Badge variant={statusColor(e.status)}>{statusLabel(e.status)}</Badge>
                )}
              </div>
              {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {e.date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(e.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                )}
                {(e.location) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
                )}
              </div>
              {/* Visit request details */}
              {e.type === "visit" && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  {e.needs_sound && <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" />Som</span>}
                  {e.needs_banners && <span className="flex items-center gap-1"><Flag className="h-3 w-3" />Faixas</span>}
                  {e.needs_political_material && <span className="flex items-center gap-1">📄 Material</span>}
                  {e.chairs_needed > 0 && <span className="flex items-center gap-1"><Armchair className="h-3 w-3" />{e.chairs_needed} cadeiras</span>}
                  {e.material_observations && <span className="italic">Obs: {e.material_observations}</span>}
                </div>
              )}
            </div>
            {e.type === "visit" && e.status !== "concluido" && (
              <Button variant="outline" size="sm" className="shrink-0 self-center" onClick={() => onComplete(e.id, e.type)}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
