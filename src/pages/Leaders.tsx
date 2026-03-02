import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Plus, Pencil, Trash2 } from "lucide-react";
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

  const fetchLeaders = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_leader", true)
      .is("deleted_at", null)
      .order("name");
    setLeaders(data || []);
  };

  useEffect(() => {
    fetchLeaders();
  }, [tenantId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // Soft delete the contact
      const { error: contactError } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString(), is_leader: false })
        .eq("id", deleteTarget.id);

      if (contactError) throw contactError;

      // Delete from leaders table
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
        <CardHeader><CardTitle>Lideranças</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead>Envolvimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma liderança cadastrada
                  </TableCell>
                </TableRow>
              ) : leaders.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell className="font-bold">{i + 1}</TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.city}</TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.engagement}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/leaders/edit/${l.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(l)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
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
