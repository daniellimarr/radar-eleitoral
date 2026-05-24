import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { campaignService } from "@/services/campaignService";
import { CAMPAIGN_CARGO_OPTIONS, CAMPAIGN_STATUS_OPTIONS } from "@/constants/options";
import { toast } from "sonner";

const defaultForm = {
  nome_campanha: "", cargo: "Vereador", cidade: "Boa Vista", estado: "RR",
  partido: "", numero: "", meta_votos: 0, limite_gastos: 0, status: "pre_campanha",
};

export default function Campaigns() {
  const { tenantId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = async () => {
    const effectiveTenantId = tenantId || "a0000000-0000-0000-0000-000000000001";
    try {
      const data = await campaignService.fetchCampaigns(effectiveTenantId);
      setItems(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => { fetchCampaigns(); }, [tenantId]);


  const handleSave = async () => {
    if (!form.nome_campanha.trim()) { toast.error("Nome da campanha é obrigatório"); return; }

    const effectiveTenantId = tenantId || "a0000000-0000-0000-0000-000000000001";

    setLoading(true);
    try {
      const payload = { 
        ...form, 
        meta_votos: Number(form.meta_votos) || 0, 
        limite_gastos: Number(form.limite_gastos) || 0, 
        tenant_id: effectiveTenantId 
      };

      await campaignService.saveCampaign(payload, editingId);
      toast.success(editingId ? "Campanha atualizada!" : "Campanha criada!");
      setIsOpen(false);
      setForm(defaultForm);
      setEditingId(null);
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setForm({ 
      nome_campanha: item.nome_campanha, 
      cargo: item.cargo, 
      cidade: item.cidade || "Boa Vista", 
      estado: item.estado || "RR", 
      partido: item.partido || "", 
      numero: item.numero || "", 
      meta_votos: item.meta_votos || 0, 
      limite_gastos: item.limite_gastos || 0, 
      status: item.status 
    });
    setEditingId(item.id); 
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await campaignService.deleteCampaign(id);
      toast.success("Campanha removida");
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateField = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Campanhas</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(defaultForm); setEditingId(null); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingId ? "Editar Campanha" : "Nova Campanha"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Campanha *</Label>
                <Input value={form.nome_campanha} onChange={e => updateField("nome_campanha", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={form.cargo} onValueChange={v => updateField("cargo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_CARGO_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Cidade</Label><Input value={form.cidade} onChange={e => updateField("cidade", e.target.value)} /></div>
              <div className="space-y-2"><Label>Estado</Label><Input value={form.estado} onChange={e => updateField("estado", e.target.value)} /></div>
              <div className="space-y-2"><Label>Partido</Label><Input value={form.partido} onChange={e => updateField("partido", e.target.value)} /></div>
              <div className="space-y-2"><Label>Número</Label><Input value={form.numero} onChange={e => updateField("numero", e.target.value)} /></div>
              <div className="space-y-2"><Label>Meta de Votos</Label><Input type="number" value={form.meta_votos} onChange={e => updateField("meta_votos", e.target.value)} /></div>
              <div className="space-y-2"><Label>Limite de Gastos (R$)</Label><Input type="number" value={form.limite_gastos} onChange={e => updateField("limite_gastos", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => updateField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Partido/Número</TableHead>
                <TableHead>Meta de Votos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma campanha cadastrada</TableCell></TableRow>
              ) : items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome_campanha}</TableCell>
                  <TableCell>{item.cargo}</TableCell>
                  <TableCell>{item.partido} {item.numero && `- ${item.numero}`}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><Target className="h-4 w-4 text-primary" />{item.meta_votos?.toLocaleString()}</div></TableCell>
                  <TableCell>
                    <Badge variant={item.status === "campanha" ? "default" : "secondary"}>
                      {CAMPAIGN_STATUS_OPTIONS.find(s => s.value === item.status)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
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
