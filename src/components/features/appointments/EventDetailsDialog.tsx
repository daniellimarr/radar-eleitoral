import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
import { MapsLink } from "@/components/shared/MapsLink";
  CalendarDays, Clock, MapPin, User, Phone, Mail, FileText,
  Armchair, Megaphone, Image as ImageIcon, Volume2, CheckCircle2, X,
} from "lucide-react";

export interface AppointmentEvent {
  id: string;
  type: "appointment" | "visit";
  title?: string | null;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  requested_date?: string | null;
  date?: string | null;
  requester_name?: string | null;
  requester_phone?: string | null;
  requester_email?: string | null;
  chairs_needed?: number | null;
  needs_political_material?: boolean | null;
  needs_banners?: boolean | null;
  needs_sound?: boolean | null;
  material_observations?: string | null;
}

interface EventDetailsDialogProps {
  event: AppointmentEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (event: AppointmentEvent) => void;
  onReject?: (event: AppointmentEvent) => void;
}

/** Formata datas de forma defensiva — valores inválidos não devem quebrar a UI. */
function safeFormat(value?: string | null, pattern = "dd/MM/yyyy 'às' HH:mm") {
  if (!value) return null;
  try {
    return format(new Date(value), pattern, { locale: ptBR });
  } catch {
    return null;
  }
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === false) return null;
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export function EventDetailsDialog({ event, open, onOpenChange, onConfirm, onReject }: EventDetailsDialogProps) {
  if (!event) return null;

  const when = safeFormat(event.start_time || event.requested_date || event.date);
  const end = safeFormat(event.end_time, "HH:mm");
  const isConfirmed = ["confirmado", "aprovada"].includes((event.status || "").toLowerCase());
  const protocolo = event.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  const checklist = [
    event.chairs_needed ? { icon: Armchair, text: `${event.chairs_needed} cadeiras` } : null,
    event.needs_sound ? { icon: Volume2, text: "Som / microfone" } : null,
    event.needs_banners ? { icon: ImageIcon, text: "Banners / faixas" } : null,
    event.needs_political_material ? { icon: Megaphone, text: "Material político (santinhos, panfletos)" } : null,
  ].filter(Boolean) as { icon: any; text: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[85vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">{event.title || "Compromisso"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isConfirmed ? "default" : "secondary"}>
              {isConfirmed ? "Confirmado" : "A confirmar"}
            </Badge>
            <Badge variant="outline">
              {event.type === "visit" ? "Solicitação de visita" : "Compromisso interno"}
            </Badge>
            <Badge variant="outline" className="font-mono">Protocolo {protocolo}</Badge>
          </div>

          <div className="rounded-lg border p-3">
            <Row icon={CalendarDays} label="Data e horário" value={when || "-"} />
            <Row icon={Clock} label="Término previsto" value={end} />
            <Row icon={MapPin} label="Local" value={event.location} />
            {event.location && (
              <MapsLink
                address={event.location}
                className="text-xs text-primary underline ml-7"
>
                Abrir no Google Maps
              </MapsLink>
            )}
          </div>

          {(event.requester_name || event.requester_phone || event.requester_email) && (
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Solicitante</p>
              <Row icon={User} label="Nome" value={event.requester_name} />
              <Row icon={Phone} label="Telefone" value={event.requester_phone} />
              <Row icon={Mail} label="E-mail" value={event.requester_email} />
            </div>
          )}

          <div className="rounded-lg border p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              O que levar para a reunião
            </p>
            {checklist.length === 0 && !event.material_observations ? (
              <p className="text-sm text-muted-foreground">Nenhum item de apoio solicitado.</p>
            ) : (
              <ul className="space-y-1.5">
                {checklist.map((item) => (
                  <li key={item.text} className="flex items-center gap-2 text-sm">
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
            {event.material_observations && (
              <p className="text-sm mt-2 border-t pt-2 whitespace-pre-wrap">{event.material_observations}</p>
            )}
          </div>

          {event.description && (
            <div className="rounded-lg border p-3">
              <Row icon={FileText} label="Descrição / observações" value={
                <span className="whitespace-pre-wrap font-normal">{event.description}</span>
              } />
            </div>
          )}

          {(onConfirm || onReject) && (
            <div className="flex flex-wrap gap-2 justify-end pt-1">
              {onReject && event.type === "visit" && (
                <Button variant="destructive" size="sm" onClick={() => onReject(event)}>
                  <X className="h-4 w-4 mr-1" /> Rejeitar
                </Button>
              )}
              {onConfirm && !isConfirmed && (
                <Button size="sm" onClick={() => onConfirm(event)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
