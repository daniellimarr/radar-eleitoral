import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLeaders } from "@/hooks/contacts/useLeaders";
import { LeaderService } from "@/services/contacts/LeaderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Plus } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { LeaderTable } from "@/components/leaders/LeaderTable";
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
  const { leaders, voterCounts, loading, refresh, deleteLeader } = useLeaders(tenantId);
  
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);
  const [voters, setVoters] = useState<Record<string, any[]>>({});
  const [loadingVoters, setLoadingVoters] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const toggleExpand = async (leaderId: string) => {
    if (expandedLeader === leaderId) {
      setExpandedLeader(null);
      return;
    }
    setExpandedLeader(leaderId);
    if (!voters[leaderId]) {
      setLoadingVoters(leaderId);
      const { data } = await LeaderService.fetchVoters(leaderId);
      setVoters((prev) => ({ ...prev, [leaderId]: data || [] }));
      setLoadingVoters(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteLeader(deleteTarget.id);
    if (success) setDeleteTarget(null);
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
          <LeaderTable 
            leaders={leaders}
            voterCounts={voterCounts}
            expandedLeader={expandedLeader}
            toggleExpand={toggleExpand}
            onNewVoter={(l) => navigate(`/leaders/edit/${l.id}?tab=voters`)}
            onEdit={(l) => navigate(`/leaders/edit/${l.id}`)}
            onDelete={setDeleteTarget}
            voters={voters}
            loadingVoters={loadingVoters}
            tableRef={tableRef}
          />
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
