import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

const statusOptions = [
  { value: "aberta", label: "Aberta", color: "bg-primary text-primary-foreground" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-warning text-warning-foreground" },
  { value: "concluida", label: "Concluída", color: "bg-success text-success-foreground" },
  { value: "cancelada", label: "Cancelada", color: "bg-destructive text-destructive-foreground" },
];

interface DemandTableProps {
  demands: any[];
  onOpenDocs: (demand: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
  tableRef: React.RefObject<HTMLTableElement>;
}

export function DemandTable({ demands, onOpenDocs, onUpdateStatus, tableRef }: DemandTableProps) {
  return (
    <Table ref={tableRef}>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Pessoa</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Docs</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {demands.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma demanda</TableCell></TableRow>
        ) : demands.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.title}</TableCell>
            <TableCell>{(d.contacts as any)?.name || "—"}</TableCell>
            <TableCell>
              <Badge className={statusOptions.find(s => s.value === d.status)?.color}>
                {statusOptions.find(s => s.value === d.status)?.label}
              </Badge>
            </TableCell>
            <TableCell className="capitalize">{d.priority}</TableCell>
            <TableCell>{new Date(d.created_at).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onOpenDocs(d)} title="Documentos">
                <Paperclip className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell>
              <Select value={d.status} onValueChange={(v) => onUpdateStatus(d.id, v)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
