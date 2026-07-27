import { jsPDF } from "jspdf";
import { formatCampaign, toCampaignDate } from "@/lib/datetime";

/**
 * Evento genérico da agenda (compromisso interno ou solicitação de visita).
 * Mantido flexível de propósito: as duas tabelas de origem têm colunas distintas.
 */
export interface AgendaPdfEvent {
  id: string;
  type?: "appointment" | "visit";
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
}

export interface AgendaPdfOptions {
  title: string;
  filename: string;
  /** Texto do período, ex.: "01/07/2026 a 31/07/2026". Opcional. */
  periodLabel?: string;
  tenantName?: string;
}

const CONFIRMED = [
  "confirmado",
  "confirmada",
  "aprovada",
  "aprovado",
  "realizado",
  "realizada",
];

function statusLabel(status?: string | null): string {
  const s = (status || "").toLowerCase().trim();
  if (CONFIRMED.includes(s)) return "CONFIRMADO";
  if (["rejeitada", "rejeitado", "cancelada", "cancelado"].includes(s)) return "CANCELADO";
  return "A CONFIRMAR";
}

function eventDate(e: AgendaPdfEvent): string | null | undefined {
  return e.start_time || e.requested_date || e.date;
}

/** Nome de quem marcou: solicitante público ou registro interno do gabinete. */
function requesterLabel(e: AgendaPdfEvent): string {
  if (e.requester_name) return e.requester_name;
  return e.type === "visit" ? "Solicitação pública" : "Gabinete (interno)";
}

function contactLabel(e: AgendaPdfEvent): string {
  return e.requester_phone || e.requester_email || "-";
}

/**
 * Gera um relatório em PDF (paisagem A4) com data, horário, endereço,
 * responsável pelo agendamento e status de cada compromisso.
 */
export function exportAgendaToPdf(events: AgendaPdfEvent[], options: AgendaPdfOptions) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;

  // Larguras somam a área útil (273mm em A4 paisagem com margem 12).
  const columns: { header: string; width: number; value: (e: AgendaPdfEvent) => string }[] = [
    { header: "Data", width: 22, value: (e) => formatCampaign(eventDate(e), "dd/MM/yyyy", "-") },
    {
      header: "Horário",
      width: 24,
      value: (e) => {
        const start = formatCampaign(eventDate(e), "HH:mm", "");
        const end = e.end_time ? formatCampaign(e.end_time, "HH:mm", "") : "";
        if (!start) return "-";
        return end ? `${start} - ${end}` : start;
      },
    },
    { header: "Compromisso", width: 52, value: (e) => e.title || "-" },
    { header: "Quem agendou", width: 42, value: requesterLabel },
    { header: "Contato", width: 32, value: contactLabel },
    { header: "Endereço / Local", width: 60, value: (e) => e.location || "-" },
    { header: "Status", width: 26, value: (e) => statusLabel(e.status) },
  ];

  const ordered = [...events].sort(
    (a, b) =>
      (toCampaignDate(eventDate(a))?.getTime() ?? 0) - (toCampaignDate(eventDate(b))?.getTime() ?? 0),
  );

  const drawHeader = () => {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 58, 95);
    pdf.text("RADAR ELEITORAL", margin, margin + 4);

    pdf.setFontSize(11);
    pdf.setTextColor(0);
    pdf.text(options.title, pageWidth / 2, margin + 4, { align: "center" });

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(110);
    const emitted = formatCampaign(new Date(), "dd/MM/yyyy 'às' HH:mm", "");
    pdf.text(`Emitido em: ${emitted}`, pageWidth - margin, margin + 4, { align: "right" });

    let sub = margin + 9;
    if (options.tenantName) {
      pdf.text(options.tenantName, margin, sub);
      sub += 4;
    }
    if (options.periodLabel) {
      pdf.text(`Período: ${options.periodLabel}`, margin, sub);
      sub += 4;
    }
    pdf.text(`Total de compromissos: ${ordered.length}`, pageWidth - margin, margin + 9, {
      align: "right",
    });
    pdf.setTextColor(0);
    return sub + 1;
  };

  const drawTableHead = (y: number) => {
    pdf.setFillColor(30, 58, 95);
    pdf.rect(margin, y, pageWidth - margin * 2, 7, "F");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255);
    let x = margin + 2;
    for (const col of columns) {
      pdf.text(col.header, x, y + 4.8);
      x += col.width;
    }
    pdf.setTextColor(0);
    pdf.setFont("helvetica", "normal");
    return y + 7;
  };

  let y = drawHeader();
  y = drawTableHead(y);

  pdf.setFontSize(7.5);
  let zebra = false;

  for (const e of ordered) {
    const cells = columns.map((col) =>
      pdf.splitTextToSize(String(col.value(e) ?? "-"), col.width - 3) as string[],
    );
    const lines = Math.max(...cells.map((c) => c.length), 1);
    const rowHeight = lines * 3.6 + 2.4;

    // Quebra de página preservando o cabeçalho da tabela.
    if (y + rowHeight > pageHeight - 14) {
      pdf.addPage();
      y = drawHeader();
      y = drawTableHead(y);
      pdf.setFontSize(7.5);
    }

    if (zebra) {
      pdf.setFillColor(244, 246, 249);
      pdf.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");
    }
    zebra = !zebra;

    let x = margin + 2;
    cells.forEach((cell, i) => {
      pdf.text(cell, x, y + 4);
      x += columns[i].width;
    });

    pdf.setDrawColor(225);
    pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  }

  if (ordered.length === 0) {
    pdf.setFontSize(10);
    pdf.text("Nenhum compromisso encontrado no período.", pageWidth / 2, y + 12, {
      align: "center",
    });
  }

  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7.5);
    pdf.setTextColor(150);
    pdf.text(
      `Radar Eleitoral — Agenda — Página ${i} de ${total}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" },
    );
    pdf.setTextColor(0);
  }

  pdf.save(`${options.filename}.pdf`);
}
