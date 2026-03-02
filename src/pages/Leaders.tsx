import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function Leaders() {
  const { tenantId } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_leader", true)
        .is("deleted_at", null)
        .order("name");
      setLeaders(data || []);
    };
    fetch();
  }, [tenantId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ranking de Lideranças</h1>

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
                <TableHead>#</TableHead><TableHead>Nome</TableHead><TableHead>Cidade</TableHead><TableHead>Celular</TableHead><TableHead>Envolvimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma liderança cadastrada</TableCell></TableRow>
              ) : leaders.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell className="font-bold">{i + 1}</TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.city}</TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.engagement}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
