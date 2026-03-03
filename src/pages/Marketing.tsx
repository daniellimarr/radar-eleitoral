import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tipoOptions = ["post", "video", "reels", "stories", "panfleto", "banner", "jingle"];
const plataformaOptions = ["Instagram", "Facebook", "TikTok", "YouTube", "WhatsApp", "Impresso", "Rádio", "TV"];
const statusOptions = [
  { value: "planejado", label: "Planejado", variant: "secondary" as const },
  { value: "aprovado", label: "Aprovado", variant: "outline" as const },
  { value: "publicado", label: "Publicado", variant: "default" as const },
];

const defaultForm = {
  titulo: "", tipo: "post", plataforma: "Instagram", data_publicacao: "",
  status: "planejado", descricao: "", custo_impulsionamento: 0,
};

export default function Marketing() {
  const { tenantId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("content_plans").select("*").eq("tenant_id", tenantId).order("data_publicacao", { ascending: true });
    setItems(data || []);
  };

  useEffect(() => { fetch(); }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId || !form.titulo.trim()) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    const payload = { ...form, custo_impulsionamento: Number(form.custo_impulsionamento), data_publicacao: form.data_publicacao || null, tenant_id: tenantId };
    if (editingId) {
      const { error } = await supabase.from("content_plans").update(payload).eq("id", editingId);
      if (error) toast.error(error.message); else toast.success("Conteúdo atualizado!");
    } else {
      const { error } = await supabase.from("content_plans").insert(payload);
      if (error) toast.error(error.message); else toast.success("Conteúdo criado!");
    }
    setLoading(false); setIsOpen(false); setForm(defaultForm); setEditingId(null); fetch();
  };

  const handleEdit = (item: any) => {
    setForm({ titulo: item.titulo, tipo: item.tipo, plataforma: item.plataforma || "Instagram", data_publicacao: item.data_publicacao || "", status: item.status, descricao: item.descricao || "", custo_impulsionamento: item.custo_impulsionamento || 0 });
    setEditingId(item.id); setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("content_plans").delete().eq("id", id);
    toast.success("Removido"); fetch();
  };

  const u = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  const planned = items.filter(i => i.status === "planejado").length;
  const approved = items.filter(i => i.status === "aprovado").length;
  const published = items.filter(i => i.status === "publicado").length;
  const totalBoost = items.reduce((s, i) => s + Number(i.custo_impulsionamento || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketing & Conteúdo</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button onClick={() => { setForm(defaultForm); setEditingId(null); }}><Plus className="h-4 w-4 mr-2" /> Novo Conteúdo</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Editar Conteúdo" : "Novo Conteúdo"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Título *</Label><Input value={form.titulo} onChange={e => u("titulo", e.target.value)} /></div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => u("tipo", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tipoOptions.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Plataforma</Label>
                <Select value={form.plataforma} onValueChange={v => u("plataforma", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{plataformaOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Data Publicação</Label><Input type="date" value={form.data_publicacao} onChange={e => u("data_publicacao", e.target.value)} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => u("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Custo Impulsionamento (R$)</Label><Input type="number" value={form.custo_impulsionamento} onChange={e => u("custo_impulsionamento", e.target.value)} /></div>
              <div className="space-y-2 col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => u("descricao", e.target.value)} rows={3} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Planejados</p><p className="text-2xl font-bold">{planned}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Aprovados</p><p className="text-2xl font-bold">{approved}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Publicados</p><p className="text-2xl font-bold">{published}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Impulsionamento</p><p className="text-2xl font-bold">R$ {totalBoost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Plataforma</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead>Impulsionamento</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum conteúdo planejado</TableCell></TableRow> :
              items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.titulo}</TableCell>
                  <TableCell className="capitalize">{item.tipo}</TableCell>
                  <TableCell>{item.plataforma}</TableCell>
                  <TableCell>{item.data_publicacao || "-"}</TableCell>
                  <TableCell><Badge variant={statusOptions.find(s => s.value === item.status)?.variant || "secondary"}>{statusOptions.find(s => s.value === item.status)?.label}</Badge></TableCell>
                  <TableCell>{Number(item.custo_impulsionamento) > 0 ? `R$ ${Number(item.custo_impulsionamento).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
