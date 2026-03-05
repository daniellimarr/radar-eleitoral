import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from "lucide-react";
import { exportTableToPdf, printTable } from "@/lib/exportPdf";
import { toast } from "sonner";

interface ExportButtonsProps {
  tableRef: React.RefObject<HTMLElement | null>;
  title: string;
  filename: string;
}

export default function ExportButtons({ tableRef, title, filename }: ExportButtonsProps) {
  const handleExportPdf = async () => {
    if (!tableRef.current) { toast.error("Nenhum dado para exportar"); return; }
    toast.info("Gerando PDF...");
    try {
      await exportTableToPdf(tableRef.current, { title, filename });
      toast.success("PDF exportado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    }
  };

  const handlePrint = () => {
    if (!tableRef.current) { toast.error("Nenhum dado para imprimir"); return; }
    printTable(tableRef.current, title);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportPdf}>
        <FileDown className="h-4 w-4 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir
      </Button>
    </div>
  );
}
