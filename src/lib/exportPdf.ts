import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ExportPdfOptions {
  title: string;
  filename: string;
  tenantName?: string;
}

export async function exportTableToPdf(
  tableElement: HTMLElement,
  options: ExportPdfOptions
) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header
  const logoUrl = new URL("/src/assets/logo-radar-eleitoral.png", window.location.origin).href;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = logoUrl;
    });
    const logoHeight = 12;
    const logoWidth = (img.width / img.height) * logoHeight;
    pdf.addImage(img, "PNG", margin, margin, logoWidth, logoHeight);
  } catch {
    // Logo failed, skip
  }

  // Title & date
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(options.title, pageWidth / 2, margin + 6, { align: "center" });

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  pdf.text(`Emitido em: ${dateStr}`, pageWidth - margin, margin + 6, { align: "right" });

  if (options.tenantName) {
    pdf.setFontSize(10);
    pdf.text(options.tenantName, pageWidth / 2, margin + 12, { align: "center" });
  }

  // Separator line
  const headerEnd = margin + 16;
  pdf.setDrawColor(200);
  pdf.line(margin, headerEnd, pageWidth - margin, headerEnd);

  // Capture table
  const canvas = await html2canvas(tableElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: tableElement.scrollWidth,
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;

  const startY = headerEnd + 4;
  const availableHeight = pageHeight - startY - margin;

  if (imgHeight <= availableHeight) {
    pdf.addImage(imgData, "PNG", margin, startY, imgWidth, imgHeight);
  } else {
    // Multi-page: slice the canvas
    const pxPerPage = (availableHeight / imgWidth) * canvas.width;
    let srcY = 0;
    let isFirstPage = true;

    while (srcY < canvas.height) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      const sliceHeight = Math.min(pxPerPage, canvas.height - srcY);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const sliceImgData = sliceCanvas.toDataURL("image/png");
      const sliceImgHeight = (sliceHeight / canvas.width) * imgWidth;
      const y = isFirstPage ? startY : margin;
      pdf.addImage(sliceImgData, "PNG", margin, y, imgWidth, sliceImgHeight);

      srcY += sliceHeight;
      isFirstPage = false;
    }
  }

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Radar Eleitoral — Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    pdf.setTextColor(0);
  }

  pdf.save(`${options.filename}.pdf`);
}

export function printTable(tableElement: HTMLElement, title: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 18px; color: #1e3a5f; margin: 0; }
        .header .date { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <span class="date">Emitido em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      ${tableElement.outerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
