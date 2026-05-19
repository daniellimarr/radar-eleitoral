import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import React from "react";

interface VehicleTableProps {
  vehicles: any[];
  onEdit: (vehicle: any) => void;
  onDelete: (id: string) => void;
  tableRef: React.RefObject<HTMLTableElement>;
}

export function VehicleTable({ vehicles, onEdit, onDelete, tableRef }: VehicleTableProps) {
  return (
    <Table ref={tableRef}>
      <TableHeader>
        <TableRow>
          <TableHead>Placa</TableHead>
          <TableHead>Modelo</TableHead>
          <TableHead>Marca</TableHead>
          <TableHead>Motorista</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum veículo</TableCell></TableRow>
        ) : vehicles.map((v) => (
          <TableRow key={v.id}>
            <TableCell className="font-medium">{v.plate}</TableCell>
            <TableCell>{v.model}</TableCell>
            <TableCell>{v.brand}</TableCell>
            <TableCell>{v.driver_name}</TableCell>
            <TableCell className="capitalize">{v.status}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(v)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(v.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
