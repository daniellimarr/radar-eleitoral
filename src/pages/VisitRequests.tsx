import { useEffect, useState, useMemo } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Plus, Clock, MapPin, Search } from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { geocodeByCep } from "@/lib/geocoding";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const visitIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00",
];

export default function VisitRequests() {
  const { tenantId, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [form, setForm] = useState({
    title: "", description: "", location: "", cep: "",
    address: "", neighborhood: "", city: "", state: "",
    chairs_needed: "0", needs_political_material: false, needs_banners: false,
    needs_sound: false, material_observations: "",
  });
  const [loading, setLoading] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  const handleCepSearch = async () => {
    if (!form.cep) return;
    setCepLoading(true);
    const result = await geocodeByCep(form.cep);
    if (result) {
      const fullAddress = [result.address, result.neighborhood, result.city, result.state].filter(Boolean).join(", ");
      setForm(p => ({
        ...p,
        address: result.address || "",
        neighborhood: result.neighborhood || "",
        city: result.city || "",
        state: result.state || "",
        location: fullAddress,
      }));
      if (result.latitude && result.longitude) {
        setLocationCoords({ lat: result.latitude, lng: result.longitude });
      }
    }
    setCepLoading(false);
  };

  const fetchRequests = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("visit_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setRequests(data || []);
  };

  useEffect(() => { fetchRequests(); }, [tenantId]);

  // Build a map of booked times per date
  const bookedMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    requests.forEach((r) => {
      if (!r.requested_date || r.status === "rejeitado" || r.status === "cancelado") return;
      const d = new Date(r.requested_date);
      const dateKey = format(d, "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, new Set());
      map.get(dateKey)!.add(format(d, "HH:mm"));
    });
    return map;
  }, [requests]);

  // Dates that have ALL slots booked
  const fullyBookedDates = useMemo(() => {
    const dates: Date[] = [];
    bookedMap.forEach((times, dateKey) => {
      if (times.size >= TIME_SLOTS.length) {
        dates.push(new Date(dateKey + "T00:00:00"));
      }
    });
    return dates;
  }, [bookedMap]);

  // Dates that have at least one booking (partially booked)
  const partiallyBookedDates = useMemo(() => {
    const dates: Date[] = [];
    bookedMap.forEach((times, dateKey) => {
      if (times.size > 0 && times.size < TIME_SLOTS.length) {
        dates.push(new Date(dateKey + "T00:00:00"));
      }
    });
    return dates;
  }, [bookedMap]);

  // Get booked times for the selected date
  const bookedTimesForSelected = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return bookedMap.get(dateKey) || new Set<string>();
  }, [selectedDate, bookedMap]);

  const handleSave = async () => {
    if (!tenantId || !form.title) { toast.error("Título é obrigatório"); return; }
    if (!selectedDate) { toast.error("Selecione uma data"); return; }
    if (!selectedTime) { toast.error("Selecione um horário"); return; }

    // Build the datetime
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const requestedDate = `${dateStr}T${selectedTime}:00`;

    // Double-check not already booked
    if (bookedTimesForSelected.has(selectedTime)) {
      toast.error("Este horário já está reservado!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("visit_requests").insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      chairs_needed: parseInt(form.chairs_needed) || 0,
      needs_political_material: form.needs_political_material,
      needs_banners: form.needs_banners,
      needs_sound: form.needs_sound,
      material_observations: form.material_observations || null,
      tenant_id: tenantId,
      requested_by: user?.id,
      requested_date: requestedDate,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Solicitação enviada!");
      setIsOpen(false);
      setSelectedDate(undefined);
      setSelectedTime("");
      setForm({ title: "", description: "", location: "", cep: "", address: "", neighborhood: "", city: "", state: "", chairs_needed: "0", needs_political_material: false, needs_banners: false, needs_sound: false, material_observations: "" });
      setLocationCoords(null);
      fetchRequests();
    }
    setLoading(false);
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (startOfDay(date) < startOfDay(new Date())) return true;
    // Disable fully booked dates
    return fullyBookedDates.some((d) => isSameDay(d, date));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitações de Visita / Reunião</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setSelectedDate(undefined); setSelectedTime(""); } }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Solicitação</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Solicitar Visita / Reunião</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>

              {/* Calendar + Time Slot Picker */}
              <div className="space-y-2">
                <Label>Data e Horário *</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="border rounded-lg p-1">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { setSelectedDate(date); setSelectedTime(""); }}
                      disabled={isDateDisabled}
                      locale={ptBR}
                      className="pointer-events-auto"
                      modifiers={{
                        booked: partiallyBookedDates,
                      }}
                      modifiersClassNames={{
                        booked: "!bg-amber-100 !text-amber-800 dark:!bg-amber-900/30 dark:!text-amber-300",
                      }}
                    />
                    <div className="flex items-center gap-4 px-3 pb-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-primary" /> Disponível
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-amber-300 dark:bg-amber-700" /> Parcial
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-muted opacity-50" /> Indisponível
                      </span>
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="flex-1 min-w-0">
                    {selectedDate ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Horários para {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[280px] overflow-y-auto">
                          {TIME_SLOTS.map((time) => {
                            const isBooked = bookedTimesForSelected.has(time);
                            const isSelected = selectedTime === time;
                            return (
                              <Button
                                key={time}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                disabled={isBooked}
                                onClick={() => setSelectedTime(time)}
                                className={cn(
                                  "text-xs",
                                  isBooked && "opacity-40 line-through cursor-not-allowed",
                                  isSelected && "ring-2 ring-primary"
                                )}
                              >
                                {time}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4">
                        Selecione uma data no calendário
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CEP + Endereço + Mapa */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Localização</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="CEP (ex: 69301-000)"
                    value={form.cep}
                    onChange={(e) => setForm(p => ({ ...p, cep: e.target.value }))}
                    className="max-w-[180px]"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleCepSearch} disabled={cepLoading}>
                    <Search className="h-4 w-4 mr-1" /> {cepLoading ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
                <Input
                  placeholder="Endereço completo"
                  value={form.location}
                  onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                />
                {locationCoords && (
                  <div className="rounded-lg overflow-hidden border h-[200px]">
                    <MapContainer
                      key={`${locationCoords.lat}-${locationCoords.lng}`}
                      center={[locationCoords.lat, locationCoords.lng]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[locationCoords.lat, locationCoords.lng]} icon={visitIcon}>
                        <Popup>{form.location}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
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
                <TableHead>Título</TableHead><TableHead>Data</TableHead><TableHead>Horário</TableHead><TableHead>Local</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma solicitação</TableCell></TableRow>
              ) : requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.requested_date ? format(new Date(r.requested_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}</TableCell>
                  <TableCell>{r.requested_date ? format(new Date(r.requested_date), "HH:mm") : "-"}</TableCell>
                  <TableCell>{r.location || "-"}</TableCell>
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
