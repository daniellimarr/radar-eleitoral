import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

const statusOptions = [
  { value: "aberta", label: "Aberta", color: "bg-primary text-primary-foreground" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-warning text-warning-foreground" },
  { value: "concluida", label: "Concluída", color: "bg-success text-success-foreground" },
  { value: "cancelada", label: "Cancelada", color: "bg-destructive text-destructive-foreground" },
];

export default function Demands() {
  const { tenantId, user } = useAuth();
  const [demands, setDemands] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "aberta", priority: "normal" });
  const [loading, setLoading] = useState(false);

  const fetchDemands = async () => {
    if (!tenantId) return;
    let query = supabase.from("demands").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false });
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setDemands(data || []);
  };

  useEffect(() => { fetchDemands(); }, [tenantId, search]);

  const handleSave = async () => {
    if (!tenantId || !form.title) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    const { error } = await supabase.from("demands").insert([{
      ...form, tenant_id: tenantId, responsible_id: user?.id,
      status: form.status as "aberta" | "em_andamento" | "concluida" | "cancelada",
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Demanda cadastrada!"); setIsOpen(false); setForm({ title: "", description: "", status: "aberta", priority: "normal" }); fetchDemands(); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("demands").update({ status: status as "aberta" | "em_andamento" | "concluida" | "cancelada" }).eq("id", id);
    fetchDemands();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Demandas</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Demanda</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Demanda</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Salvando..." : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Pesquisar demanda..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demands.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma demanda</TableCell></TableRow>
              ) : demands.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>
                    <Badge className={statusOptions.find(s => s.value === d.status)?.color}>
                      {statusOptions.find(s => s.value === d.status)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{d.priority}</TableCell>
                  <TableCell>{new Date(d.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Select value={d.status} onValueChange={(v) => updateStatus(d.id, v)}>
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
        </CardContent>
      </Card>
    </div>
  );
}
