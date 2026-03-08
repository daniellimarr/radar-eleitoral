import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Users } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";

import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Leaders() {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);
  const [voters, setVoters] = useState<Record<string, any[]>>({});
  const [loadingVoters, setLoadingVoters] = useState<string | null>(null);
  const [voterCounts, setVoterCounts] = useState<Record<string, number>>({});
  const tableRef = useRef<HTMLTableElement>(null);

  const fetchLeaders = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_leader", true)
      .is("deleted_at", null)
      .order("name");
    setLeaders(data || []);

    // Fetch voter counts per leader
    if (data && data.length > 0) {
      const leaderIds = data.map((l: any) => l.id);
      const { data: allVoters } = await supabase
        .from("contacts_decrypted")
        .select("leader_id")
        .in("leader_id", leaderIds)
        .is("deleted_at", null);
      
      const counts: Record<string, number> = {};
      (allVoters || []).forEach((v: any) => {
        counts[v.leader_id] = (counts[v.leader_id] || 0) + 1;
      });
      setVoterCounts(counts);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, [tenantId]);

  const toggleExpand = async (leaderId: string) => {
    if (expandedLeader === leaderId) {
      setExpandedLeader(null);
      return;
    }
    setExpandedLeader(leaderId);
    if (!voters[leaderId]) {
      setLoadingVoters(leaderId);
      const { data } = await supabase
        .from("contacts")
        .select("id, name, phone, city, engagement")
        .eq("leader_id", leaderId)
        .is("deleted_at", null)
        .order("name");
      setVoters((prev) => ({ ...prev, [leaderId]: data || [] }));
      setLoadingVoters(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error: contactError } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString(), is_leader: false })
        .eq("id", deleteTarget.id);
      if (contactError) throw contactError;

      const { error: leaderError } = await supabase
        .from("leaders")
        .delete()
        .eq("contact_id", deleteTarget.id);
      if (leaderError) throw leaderError;

      toast({ title: "Liderança excluída com sucesso" });
      setDeleteTarget(null);
      fetchLeaders();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ranking de Lideranças</h1>
        <Button onClick={() => navigate("/leaders/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Liderança
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Trophy className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Total Lideranças</p>
              <p className="text-2xl font-bold">{leaders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lideranças</CardTitle>
          <ExportButtons tableRef={tableRef} title="Lideranças" filename="liderancas" />
        </CardHeader>
        <CardContent className="p-0">
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
              ) : leaders.map((l, i) => (
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
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/leaders/edit/${l.id}?tab=voters`)} title="Cadastrar eleitor">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/leaders/edit/${l.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(l)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedLeader === l.id && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/30 p-0">
                        <div className="px-6 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-semibold text-muted-foreground">
                                Eleitores de {l.name}
                              </span>
                              <Badge variant="outline" className="ml-1">
                                {voters[l.id]?.length ?? "..."}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={(e) => { e.stopPropagation(); navigate(`/leaders/edit/${l.id}?tab=voters`); }}
                            >
                              <Plus className="h-3 w-3" /> Novo Eleitor
                            </Button>
                          </div>
                          {loadingVoters === l.id ? (
                            <p className="text-sm text-muted-foreground">Carregando...</p>
                          ) : (voters[l.id]?.length ?? 0) === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum eleitor cadastrado para esta liderança.</p>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir liderança?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
