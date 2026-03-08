import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

// Sanitize text to prevent XSS when interpolated into HTML
function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// Sanitize HTML content to remove script tags and event handlers
function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  // Remove all script elements
  doc.querySelectorAll("script").forEach((el) => el.remove());
  // Remove event handler attributes
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
    // Remove javascript: URLs
    if (el.hasAttribute("href") && el.getAttribute("href")?.startsWith("javascript:")) {
      el.removeAttribute("href");
    }
    if (el.hasAttribute("src") && el.getAttribute("src")?.startsWith("javascript:")) {
      el.removeAttribute("src");
    }
  });
  return doc.body.innerHTML;
}

interface ExportPdfOptions {
  title: string;
  filename: string;
  tenantName?: string;
}

// Convert imported logo URL to base64 for jsPDF
async function loadLogoAsImage(): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = logoRadar;
    });
    return img;
  } catch {
    return null;
  }
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

  // Header with logo
  const logoImg = await loadLogoAsImage();
  if (logoImg) {
    const logoHeight = 14;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    pdf.addImage(logoImg, "PNG", margin, margin - 2, logoWidth, logoHeight);
  }

  // System name next to logo
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(30, 58, 95); // Dark blue
  const logoTextX = margin + (logoImg ? ((logoImg.width / logoImg.height) * 14) + 4 : 0);
  pdf.text("RADAR ELEITORAL", logoTextX, margin + 5);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(120);
  pdf.text("Tecnologia a serviço da política", logoTextX, margin + 9);
  pdf.setTextColor(0);

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

  const safeTitle = escapeHtml(title);
  const safeTableHtml = sanitizeHtml(tableElement.outerHTML);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${safeTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 20px; }
        .header img { height: 40px; }
        .header-text h1 { font-size: 18px; color: #1e3a5f; margin: 0; }
        .header-text p { font-size: 10px; color: #888; margin: 2px 0 0; }
        .header .right { margin-left: auto; text-align: right; }
        .header .right .title { font-size: 14px; font-weight: bold; color: #1e3a5f; }
        .header .right .date { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        @media print { body { margin: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoRadar}" alt="Radar Eleitoral" />
        <div class="header-text">
          <h1>RADAR ELEITORAL</h1>
          <p>Tecnologia a serviço da política</p>
        </div>
        <div class="right">
          <div class="title">${safeTitle}</div>
          <div class="date">Emitido em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>
      ${safeTableHtml}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
