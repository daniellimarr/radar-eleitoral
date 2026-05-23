import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMarketing } from "@/hooks/marketing/useMarketing";
import { MarketingService } from "@/services/marketing/MarketingService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { MarketingTable } from "@/components/marketing/MarketingTable";

const tipoOptions = ["post", "video", "reels", "stories", "panfleto", "banner", "jingle"];
const plataformaOptions = ["Instagram", "Facebook", "TikTok", "YouTube", "WhatsApp", "Impresso", "Rádio", "TV"];
const statusOptions = [
  { value: "planejado", label: "Planejado" },
  { value: "aprovado", label: "Aprovado" },
  { value: "publicado", label: "Publicado" },
];

const defaultForm = {
  titulo: "", tipo: "post", plataforma: "Instagram", data_publicacao: "",
  status: "planejado", descricao: "", custo_impulsionamento: 0,
};

export default function Marketing() {
  const { tenantId } = useAuth();
  const { items, loading: marketingLoading, refresh, deleteItem } = useMarketing(tenantId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!tenantId || !form.titulo.trim()) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    const payload = { ...form, custo_impulsionamento: Number(form.custo_impulsionamento || 0), data_publicacao: form.data_publicacao || null, tenant_id: tenantId };
    
    const { error } = await MarketingService.saveContentPlan(payload, editingId);
    if (error) toast.error(error.message);
    else {
      toast.success(editingId ? "Conteúdo atualizado!" : "Conteúdo criado!");
      setIsOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      refresh();
    }
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setForm({ 
      titulo: item.titulo, 
      tipo: item.tipo, 
      plataforma: item.plataforma || "Instagram", 
      data_publicacao: item.data_publicacao || "", 
      status: item.status, 
      descricao: item.descricao || "", 
      custo_impulsionamento: item.custo_impulsionamento || 0 
    });
    setEditingId(item.id);
    setIsOpen(true);
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
                <Select value={form.tipo} onValueChange={v => u("tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tipoOptions.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Plataforma</Label>
                <Select value={form.plataforma} onValueChange={v => u("plataforma", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{plataformaOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Data Publicação</Label><Input type="date" value={form.data_publicacao} onChange={e => u("data_publicacao", e.target.value)} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => u("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Planejados</p><p className="text-2xl font-bold">{planned}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Aprovados</p><p className="text-2xl font-bold">{approved}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Publicados</p><p className="text-2xl font-bold">{published}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Impulsionamento</p><p className="text-2xl font-bold">R$ {totalBoost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <MarketingTable 
            items={items}
            onEdit={handleEdit}
            onDelete={deleteItem}
          />
        </CardContent>
      </Card>
    </div>
  );
}
