import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Eraser, ChevronLeft, ChevronRight, MessageSquare, X, CheckCircle2, CalendarSync } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

// Brazilian holidays (simplified — static for 2026)
const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Confraternização Universal",
  "2026-02-16": "Carnaval",
  "2026-02-17": "Carnaval",
  "2026-02-18": "Cinzas",
  "2026-04-03": "Paixão de Cristo",
  "2026-04-05": "Páscoa",
  "2026-04-21": "Tiradentes",
  "2026-05-01": "Dia do Trabalho",
  "2026-06-04": "Corpus Christi",
  "2026-09-07": "Independência",
  "2026-10-12": "N. S. Aparecida",
  "2026-11-02": "Finados",
  "2026-11-15": "Proclamação da República",
  "2026-12-25": "Natal",
};

function getMonthGrid(year: number, month: number) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);
  const grid: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(startDay).fill(null);
  for (const d of days) {
    week.push(d);
    if (week.length === 7) { grid.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  return grid;
}

export default function Appointments() {
  const { tenantId, user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [visitRequests, setVisitRequests] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCalendarId, setImportCalendarId] = useState("");
  const [importing, setImporting] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [loadingGoogleAuth, setLoadingGoogleAuth] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start_time: "", end_time: "", location: "" });
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState("");
  const [viewFilter, setViewFilter] = useState("");
  const [checkAll, setCheckAll] = useState(true);
  const [checkLinked, setCheckLinked] = useState(false);
  const [checkUnlinked, setCheckUnlinked] = useState(false);
  const [checkImportant, setCheckImportant] = useState(false);

  // View
  const [activeTab, setActiveTab] = useState<"geral" | "semanal" | "mensal">("geral");
  const [baseMonth, setBaseMonth] = useState(new Date());

  // List view state
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Selected date from calendar click
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const handleDelete = async (id: string, type: "appointment" | "visit") => {
    const table = type === "appointment" ? "appointments" : "visit_requests";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Compromisso excluído!"); fetchData(); }
  };

  const handleConfirm = async (id: string, type: "appointment" | "visit") => {
    const table = type === "appointment" ? "appointments" : "visit_requests";
    const { error } = await supabase.from(table).update({ status: "confirmado" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Confirmado!"); fetchData(); }
  };

  // Fetch Google Client ID
  const fetchGoogleClientId = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-config");
      if (error) throw error;
      if (data?.clientId) setGoogleClientId(data.clientId);
    } catch (err) {
      console.error("Failed to fetch Google Client ID:", err);
    }
  };

  useEffect(() => { fetchGoogleClientId(); }, []);

  const handleGoogleAuth = () => {
    if (!googleClientId) {
      toast.error("Configuração do Google não encontrada");
      return;
    }
    setLoadingGoogleAuth(true);

    const tokenClient = (window as any).google?.accounts?.oauth2?.initTokenClient({
      client_id: googleClientId,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: (response: any) => {
        setLoadingGoogleAuth(false);
        if (response.error) {
          toast.error("Falha na autenticação com o Google: " + response.error);
          return;
        }
        setGoogleAccessToken(response.access_token);
        toast.success("Conectado ao Google Agenda! Clique em 'Importar eventos' para continuar.");
      },
    });

    if (!tokenClient) {
      setLoadingGoogleAuth(false);
      toast.error("Biblioteca do Google não carregada. Recarregue a página.");
      return;
    }

    tokenClient.requestAccessToken();
  };

  const handleImportGoogleCalendar = async () => {
    if (!googleAccessToken && !importCalendarId.trim()) {
      toast.error("Conecte ao Google ou informe o ID do calendário");
      return;
    }
    setImporting(true);
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), 0, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

      const body: any = { timeMin, timeMax };
      if (googleAccessToken) {
        body.accessToken = googleAccessToken;
        body.calendarId = "all"; // Import from all calendars
      } else {
        body.calendarId = importCalendarId.trim();
      }

      const { data, error } = await supabase.functions.invoke("import-google-calendar", { body });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Importação concluída! ${data.imported} eventos importados, ${data.skipped} ignorados.`);
      setIsImportOpen(false);
      setImportCalendarId("");
      setGoogleAccessToken(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar eventos");
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setYearFilter(new Date().getFullYear().toString());
    setStatusFilter("");
    setViewFilter("");
    setCheckAll(true);
    setCheckLinked(false);
    setCheckUnlinked(false);
    setCheckImportant(false);
  };

  // Build appointment date set for calendar highlights
  const appointmentDates = useMemo(() => {
    const set = new Set<string>();
    for (const a of appointments) {
      if (a.start_time) set.add(format(new Date(a.start_time), "yyyy-MM-dd"));
    }
    for (const v of visitRequests) {
      if (v.requested_date) set.add(format(new Date(v.requested_date), "yyyy-MM-dd"));
    }
    return set;
  }, [appointments, visitRequests]);

  // Months to show in Geral view (3 months centered on baseMonth)
  const displayMonths = useMemo(() => {
    const prev = subMonths(baseMonth, 1);
    const next = addMonths(baseMonth, 1);
    return [prev, baseMonth, next];
  }, [baseMonth]);

  // Events for list view
  const listEvents = useMemo(() => {
    const from = new Date(dateFrom + "T00:00:00");
    const to = new Date(dateTo + "T23:59:59");
    const all = [
      ...appointments.map(a => ({ ...a, type: "appointment" as const, date: a.start_time })),
      ...visitRequests.map(v => ({ ...v, type: "visit" as const, date: v.requested_date })),
    ].filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d >= from && d <= to;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return all;
  }, [appointments, visitRequests, dateFrom, dateTo]);

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllRows = () => setSelectedRows(new Set(listEvents.map(e => e.id)));
  const deselectAllRows = () => setSelectedRows(new Set());

  // Events for the selected calendar date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const from = new Date(selectedDate + "T00:00:00");
    const to = new Date(selectedDate + "T23:59:59");
    return [
      ...appointments.map(a => ({ ...a, type: "appointment" as const, date: a.start_time })),
      ...visitRequests.map(v => ({ ...v, type: "visit" as const, date: v.requested_date })),
    ].filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d >= from && d <= to;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, visitRequests, selectedDate]);

  const toggleSelectedRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agenda de compromissos</h1>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["geral", "semanal", "mensal"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium border border-b-0 transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-muted/30"
            }`}
          >
            {tab === "geral" ? "Geral" : tab === "semanal" ? "Semanal" : "Mensal"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Compromisso</Label>
              <Input placeholder="" value={searchText} onChange={e => setSearchText(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Ano</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Visualização</Label>
              <Select value={viewFilter} onValueChange={setViewFilter}>
                <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="calendar">Calendário</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={checkAll} onCheckedChange={(v) => setCheckAll(!!v)} /> Todas Agendas
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={checkLinked} onCheckedChange={(v) => setCheckLinked(!!v)} /> Atendimentos vinculados
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={checkUnlinked} onCheckedChange={(v) => setCheckUnlinked(!!v)} /> Não vinculados
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={checkImportant} onCheckedChange={(v) => setCheckImportant(!!v)} /> Importante
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button size="sm" className="bg-info text-info-foreground hover:bg-info/90">
                <Search className="h-4 w-4 mr-1" /> Pesquisar
              </Button>
              <Button size="sm" variant="destructive">
                <Eraser className="h-4 w-4 mr-1" /> Limpar filtros
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setBaseMonth(subMonths(baseMonth, 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Mês anterior
              </Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={() => setBaseMonth(addMonths(baseMonth, 1))}>
                Próximo mês <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid - 3 months */}
      {(activeTab === "geral" || activeTab === "mensal") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {displayMonths.map((monthDate, idx) => {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const grid = getMonthGrid(year, month);
            const monthLabel = format(monthDate, "MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase();

            // Collect holidays for this month
            const monthHolidays: string[] = [];
            for (const [dateStr, name] of Object.entries(HOLIDAYS_2026)) {
              const hDate = new Date(dateStr + "T12:00:00");
              if (isSameMonth(hDate, monthDate)) {
                monthHolidays.push(`${hDate.getDate()} - ${name}`);
              }
            }

            return (
              <div key={idx} className="border border-border rounded-lg overflow-hidden">
                {/* Month header */}
                <div className="bg-info text-info-foreground px-3 py-2 font-bold text-sm tracking-wide">
                  {monthLabel}
                </div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 bg-muted/20">
                  {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-xs font-semibold py-1 text-muted-foreground">{d}</div>
                  ))}
                </div>
                {/* Day grid */}
                {grid.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-t border-border">
                    {week.map((day, di) => {
                      if (!day) return <div key={di} className="h-10 bg-muted/10" />;
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isToday = isSameDay(day, today);
                      const hasAppointment = appointmentDates.has(dateStr);
                      const isHoliday = HOLIDAYS_2026[dateStr];
                      const isCurrentMonth = isSameMonth(day, monthDate);

                      return (
                        <div
                          key={di}
                          onClick={() => handleDayClick(day)}
                          className={`h-10 flex items-center justify-center text-sm relative cursor-pointer transition-colors
                            ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
                            ${isToday ? "bg-info/20 font-bold text-info" : ""}
                            ${hasAppointment ? "bg-info/30 text-info font-semibold" : ""}
                            ${isHoliday ? "text-destructive font-semibold" : ""}
                            ${selectedDate === dateStr ? "ring-2 ring-primary ring-inset" : ""}
                            hover:bg-info/10
                          `}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}
                  </div>
                ))}
                {/* Holiday legend */}
                {monthHolidays.length > 0 && (
                  <div className="px-3 py-1 text-xs text-destructive">
                    {monthHolidays.join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-6 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-info/40" /> Compromisso agendado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-destructive/40" /> Feriado
        </span>
      </div>

      {/* Selected date events */}
      {selectedDate && (activeTab === "geral" || activeTab === "mensal") && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-info">
                {format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy")}
              </h3>
              <div className="flex gap-2">
                <Button size="sm" className="bg-info text-info-foreground hover:bg-info/90" onClick={() => setSelectedRows(new Set(selectedDateEvents.map(e => e.id)))}>
                  ☑ Marcar todos
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setSelectedRows(new Set())}>
                  ☐ Desmarcar todos
                </Button>
              </div>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">Nenhum compromisso nesta data</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-info/10">
                      <TableHead className="w-12">Marcar</TableHead>
                      <TableHead>Quem Agendou</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Compromisso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDateEvents.map(event => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(event.id)}
                            onCheckedChange={() => toggleSelectedRow(event.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs uppercase">
                          {event.created_by ? "USUÁRIO" : "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {event.start_time
                            ? format(new Date(event.start_time || event.date), "HH:mm")
                            : "-"}
                          {event.end_time && (
                            <><br />{format(new Date(event.end_time), "HH:mm")}</>
                          )}
                        </TableCell>
                        <TableCell className="text-xs uppercase font-medium">
                          {event.title}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold uppercase ${event.status === "confirmado" ? "text-success" : "text-warning"}`}>
                            {event.status === "confirmado" ? "CONFIRMADO" : "A CONFIRMAR"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs uppercase">
                          {event.location || "-"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px]">
                          {event.description || ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button className="text-success hover:text-success/70" title="Confirmar" onClick={() => handleConfirm(event.id, event.type)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button className="text-destructive hover:text-destructive/70" title="Excluir" onClick={() => handleDelete(event.id, event.type)}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="bg-success/10 border border-success/30 rounded px-4 py-2 text-sm">
              Total de compromissos nesta data: <strong className="text-info">{selectedDateEvents.length}</strong>
            </div>
          </CardContent>
        </Card>
      )}


      {activeTab === "semanal" && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Date range + export */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Data excel</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
                <span className="text-sm">até</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
              </div>
              <Button size="sm" className="bg-info text-info-foreground hover:bg-info/90">
                📊 Gerar excel
              </Button>
              <Button size="sm" className="bg-info text-info-foreground hover:bg-info/90">
                🖨 Imprimir
              </Button>
            </div>

            {/* Bulk actions */}
            <div className="flex gap-2">
              <Button size="sm" className="bg-info text-info-foreground hover:bg-info/90" onClick={selectAllRows}>
                ☑ Marcar todos
              </Button>
              <Button size="sm" variant="destructive" onClick={deselectAllRows}>
                ☐ Desmarcar todos
              </Button>
            </div>

            {/* Date heading */}
            <h3 className="text-lg font-bold text-info">
              {format(new Date(dateFrom), "dd/MM/yyyy")}
            </h3>

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-info/10">
                    <TableHead className="w-12">Marcar</TableHead>
                    <TableHead>Quem Agendou</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Compromisso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum compromisso encontrado no período
                      </TableCell>
                    </TableRow>
                  ) : (
                    listEvents.map(event => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(event.id)}
                            onCheckedChange={() => toggleRow(event.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs uppercase">
                          {event.created_by ? "USUÁRIO" : "-"}
                        </TableCell>
                        <TableCell className="text-xs uppercase">
                          {event.created_by ? "RESPONSÁVEL" : "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {event.start_time
                            ? format(new Date(event.start_time || event.date), "HH:mm")
                            : "-"}
                          {event.end_time && (
                            <><br />{format(new Date(event.end_time), "HH:mm")}</>
                          )}
                        </TableCell>
                        <TableCell className="text-xs uppercase font-medium">
                          {event.title}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold uppercase ${event.status === "confirmado" ? "text-success" : "text-warning"}`}>
                            {event.status === "confirmado" ? "CONFIRMADO" : "A CONFIRMAR"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs uppercase">
                          {event.location || "-"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px]">
                          {event.description || ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button className="text-success hover:text-success/70" title="Confirmar" onClick={() => handleConfirm(event.id, event.type)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button className="text-destructive hover:text-destructive/70" title="Excluir" onClick={() => handleDelete(event.id, event.type)}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="bg-success/10 border border-success/30 rounded px-4 py-2 text-sm">
                Total de compromissos hoje: <strong className="text-info">{listEvents.length}</strong>
              </div>
              <div className="bg-success/10 border border-success/30 rounded px-4 py-2 text-sm">
                Total de compromissos no mês: <strong className="text-info">{appointments.length + visitRequests.length}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-success text-success-foreground hover:bg-success/90">
              <Plus className="h-4 w-4 mr-2" /> Cadastrar compromisso
            </Button>
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

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-info text-info hover:bg-info/10">
              <CalendarSync className="h-4 w-4 mr-2" /> Importar do Google Agenda
            </Button>
          </DialogTrigger>
           <DialogContent>
            <DialogHeader><DialogTitle>Importar do Google Agenda</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* OAuth Flow */}
              <div className="space-y-2">
                <Label className="font-semibold">Opção 1: Conectar sua conta Google (recomendado)</Label>
                <p className="text-xs text-muted-foreground">
                  Importa todos os eventos de todos os seus calendários, incluindo privados.
                </p>
                {googleAccessToken ? (
                  <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-md">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-sm text-success font-medium">Conectado ao Google Agenda!</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleGoogleAuth}
                    disabled={loadingGoogleAuth || !googleClientId}
                    variant="outline"
                    className="w-full border-info text-info hover:bg-info/10"
                  >
                    {loadingGoogleAuth ? "Conectando..." : "🔗 Conectar ao Google Agenda"}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OU</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Public calendar flow */}
              <div className="space-y-2">
                <Label className="font-semibold">Opção 2: Calendário público (via ID)</Label>
                <Input
                  placeholder="exemplo@gmail.com ou ID do calendário"
                  value={importCalendarId}
                  onChange={(e) => setImportCalendarId(e.target.value)}
                  disabled={!!googleAccessToken}
                />
                <p className="text-xs text-muted-foreground">
                  Apenas para calendários configurados como públicos no Google Agenda.
                </p>
              </div>

              <Button
                onClick={handleImportGoogleCalendar}
                disabled={importing || (!googleAccessToken && !importCalendarId.trim())}
                className="w-full bg-info text-info-foreground hover:bg-info/90"
              >
                {importing ? "Importando..." : googleAccessToken ? "Importar todos os eventos" : "Importar eventos"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
