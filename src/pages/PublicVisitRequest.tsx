import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Clock, CheckCircle2, CalendarDays } from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30","20:00",
];

export default function PublicVisitRequest() {
  const { slug } = useParams<{ slug: string }>();
  const [linkInfo, setLinkInfo] = useState<{ tenant_id: string; tenant_name: string } | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [busySlots, setBusySlots] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [protocol, setProtocol] = useState<string>("");
  const [confirmedDate, setConfirmedDate] = useState<string>("");
  const [form, setForm] = useState({
    requester_name: "",
    requester_phone: "",
    requester_email: "",
    title: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase.rpc("get_registration_link_info", { p_slug: slug });
      const info = Array.isArray(data) ? data[0] : data;
      if (info?.tenant_id) {
        setLinkInfo({ tenant_id: info.tenant_id, tenant_name: info.tenant_name });
        const { data: busy } = await supabase.rpc("get_tenant_busy_slots", { p_tenant_id: info.tenant_id });
        setBusySlots((busy || []).map((b: any) => new Date(b.slot)));
      }
      setLoadingLink(false);
    })();
  }, [slug]);

  const bookedMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    busySlots.forEach((d) => {
      const k = format(d, "yyyy-MM-dd");
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(format(d, "HH:mm"));
    });
    return m;
  }, [busySlots]);

  const fullyBooked = useMemo(() => {
    const arr: Date[] = [];
    bookedMap.forEach((t, k) => { if (t.size >= TIME_SLOTS.length) arr.push(new Date(k + "T00:00:00")); });
    return arr;
  }, [bookedMap]);

  const partial = useMemo(() => {
    const arr: Date[] = [];
    bookedMap.forEach((t, k) => { if (t.size > 0 && t.size < TIME_SLOTS.length) arr.push(new Date(k + "T00:00:00")); });
    return arr;
  }, [bookedMap]);

  const bookedForSelected = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    return bookedMap.get(format(selectedDate, "yyyy-MM-dd")) || new Set<string>();
  }, [selectedDate, bookedMap]);

  const isDateDisabled = (d: Date) => {
    if (startOfDay(d) < startOfDay(new Date())) return true;
    return fullyBooked.some((x) => isSameDay(x, d));
  };

  const handleSubmit = async () => {
    if (!linkInfo) return;
    if (!form.requester_name || !form.requester_phone) return toast.error("Nome e telefone são obrigatórios");
    if (!form.title) return toast.error("Informe o assunto");
    if (!selectedDate || !selectedTime) return toast.error("Selecione data e horário");
    if (bookedForSelected.has(selectedTime)) return toast.error("Horário já reservado");

    setSubmitting(true);
    const requested_date = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`;
    const { data: inserted, error } = await supabase.from("visit_requests").insert({
      tenant_id: linkInfo.tenant_id,
      requested_by: null,
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      requested_date,
      requester_name: form.requester_name,
      requester_phone: form.requester_phone,
      requester_email: form.requester_email || null,
      status: "pendente",
    } as any).select("id").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const id = (inserted as any)?.id as string | undefined;
    setProtocol(id ? id.replace(/-/g, "").slice(0, 8).toUpperCase() : "");
    setConfirmedDate(format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) + " às " + selectedTime);
    setSuccess(true);
  };

  if (loadingLink) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!linkInfo) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Link inválido ou expirado.</div>;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Solicitação enviada!</h1>
            <p className="text-muted-foreground">Sua solicitação foi encaminhada para a equipe. Entraremos em contato para confirmar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <CalendarDays className="h-10 w-10 text-primary mx-auto" />
          <h1 className="text-2xl md:text-3xl font-bold">Agendar Visita / Reunião</h1>
          <p className="text-muted-foreground">{linkInfo.tenant_name}</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Seus dados</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome completo *</Label><Input value={form.requester_name} onChange={(e) => setForm(p => ({...p, requester_name: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Telefone / WhatsApp *</Label><Input value={form.requester_phone} onChange={(e) => setForm(p => ({...p, requester_phone: e.target.value}))} /></div>
            </div>
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.requester_email} onChange={(e) => setForm(p => ({...p, requester_email: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Assunto *</Label><Input value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder="Ex: Reunião sobre projeto do bairro" /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} rows={3} /></div>
            <div className="space-y-2"><Label>Local sugerido</Label><Input value={form.location} onChange={(e) => setForm(p => ({...p, location: e.target.value}))} placeholder="Endereço ou referência" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Escolha data e horário</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="border rounded-lg p-1 self-start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); }}
                  disabled={isDateDisabled}
                  locale={ptBR}
                  className="pointer-events-auto"
                  modifiers={{ booked: partial, full: fullyBooked }}
                  modifiersClassNames={{
                    booked: "!bg-amber-100 !text-amber-800 dark:!bg-amber-900/30 dark:!text-amber-300",
                    full: "!bg-destructive/20 !text-destructive line-through",
                  }}
                />
                <div className="flex flex-wrap items-center gap-3 px-3 pb-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-primary" /> Livre</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-amber-300" /> Parcial</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-destructive/40" /> Lotado</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {selectedDate ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1"><Clock className="h-4 w-4" /> Horários — {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[320px] overflow-y-auto">
                      {TIME_SLOTS.map((t) => {
                        const isBooked = bookedForSelected.has(t);
                        const isSel = selectedTime === t;
                        return (
                          <Button key={t} type="button" size="sm" variant={isSel ? "default" : "outline"}
                            disabled={isBooked} onClick={() => setSelectedTime(t)}
                            className={cn("text-xs", isBooked && "opacity-40 line-through", isSel && "ring-2 ring-primary")}
                          >{t}</Button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4">Selecione uma data</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar solicitação"}
        </Button>
      </div>
    </div>
  );
}
