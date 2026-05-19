import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import React from "react";

const statusOptions = [
  { value: "planejado", label: "Planejado", variant: "secondary" as const },
  { value: "aprovado", label: "Aprovado", variant: "outline" as const },
  { value: "publicado", label: "Publicado", variant: "default" as const },
];

interface MarketingTableProps {
  items: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function MarketingTable({ items, onEdit, onDelete }: MarketingTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Plataforma</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Impulsionamento</TableHead>
          <TableHead className="w-20">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum conteúdo planejado</TableCell></TableRow>
        ) : (
          items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.titulo}</TableCell>
              <TableCell className="capitalize">{item.tipo}</TableCell>
              <TableCell>{item.plataforma}</TableCell>
              <TableCell>{item.data_publicacao || "-"}</TableCell>
              <TableCell>
                <Badge variant={statusOptions.find(s => s.value === item.status)?.variant || "secondary"}>
                  {statusOptions.find(s => s.value === item.status)?.label}
                </Badge>
              </TableCell>
              <TableCell>
                {Number(item.custo_impulsionamento) > 0 
                  ? `R$ ${Number(item.custo_impulsionamento).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` 
                  : "-"
                }
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
