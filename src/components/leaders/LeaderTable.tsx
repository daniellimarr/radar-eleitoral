import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";

interface LeaderTableProps {
  leaders: any[];
  voterCounts: Record<string, number>;
  expandedLeader: string | null;
  toggleExpand: (id: string) => void;
  onNewVoter: (leader: any) => void;
  onEdit: (leader: any) => void;
  onDelete: (leader: any) => void;
  voters: Record<string, any[]>;
  loadingVoters: string | null;
  tableRef: React.RefObject<HTMLTableElement>;
}

export function LeaderTable({
  leaders,
  voterCounts,
  expandedLeader,
  toggleExpand,
  onNewVoter,
  onEdit,
  onDelete,
  voters,
  loadingVoters,
  tableRef
}: LeaderTableProps) {
  return (
    <Table ref={tableRef}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <TableHead>#</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Cidade</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead>Eleitores</TableHead>
          <TableHead>Envolvimento</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              Nenhuma liderança cadastrada
            </TableCell>
          </TableRow>
        ) : (
          leaders.map((l, i) => (
            <React.Fragment key={l.id}>
              <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(l.id)}>
                <TableCell className="w-10">
                  {expandedLeader === l.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-bold">{i + 1}</TableCell>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell>{l.city}</TableCell>
                <TableCell>{l.phone}</TableCell>
                <TableCell>
                  <div className="space-y-1 min-w-[120px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{voterCounts[l.id] || 0} eleitores</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{l.engagement}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => onNewVoter(l)} title="Cadastrar eleitor">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(l)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(l)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedLeader === l.id && (
                <TableRow>
                  <TableCell colSpan={8} className="bg-muted/30 p-0">
                    <div className="px-6 py-4">
                      {/* Sub-table with voters for the leader */}
                      {loadingVoters === l.id ? (
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                      ) : (voters[l.id]?.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum eleitor cadastrado.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Celular</TableHead>
                              <TableHead>Cidade</TableHead>
                              <TableHead>Engajamento</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {voters[l.id].map((v) => (
                              <TableRow key={v.id}>
                                <TableCell>{v.name}</TableCell>
                                <TableCell>{v.phone}</TableCell>
                                <TableCell>{v.city}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{v.engagement}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
}
