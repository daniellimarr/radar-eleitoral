import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Phone, MapPin, UserCheck } from "lucide-react";

interface ContactRowProps {
  contact: any;
  onEdit: (c: any) => void;
  onDelete: (id: string) => void;
}

const engagementConfig: Record<string, { label: string, color: string }> = {
  nao_trabalhado: { label: "Não Trabalhado", color: "bg-slate-100 text-slate-700 border-slate-200" },
  em_prospeccao: { label: "Em Prospecção", color: "bg-blue-100 text-blue-700 border-blue-200" },
  conquistado: { label: "Conquistado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  criando_envolvimento: { label: "Envolvimento", color: "bg-amber-100 text-amber-700 border-amber-200" },
  falta_trabalhar: { label: "Falta Trabalhar", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  envolvimento_perdido: { label: "Perdido", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const ContactRow = memo(({ contact, onEdit, onDelete }: ContactRowProps) => {
  const config = engagementConfig[contact.engagement] || engagementConfig.nao_trabalhado;

  return (
    <TableRow className="hover:bg-slate-50/50 transition-colors group">
      <TableCell>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">
            {contact.name}
          </span>
          {contact.nickname && (
            <span className="text-xs text-slate-500 font-medium">
              "{contact.nickname}"
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm font-medium">{contact.phone || "—"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm">{contact.neighborhood || "—"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {contact.leader_name && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              <UserCheck className="h-3 w-3" />
              {contact.leader_name}
            </div>
          )}
          {!contact.leader_name && <span className="text-xs text-slate-400">—</span>}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wider ${config.color}`}>
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 border-slate-200 hover:border-primary hover:text-primary"
            onClick={() => onEdit(contact)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 border-slate-200 hover:border-destructive hover:text-destructive"
            onClick={() => onDelete(contact.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

ContactRow.displayName = "ContactRow";
