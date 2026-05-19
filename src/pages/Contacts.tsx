import { useEffect, useState, useRef, useCallback, memo, Suspense, lazy } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useContacts } from "@/hooks/contacts/useContacts";
import { ContactService } from "@/services/contacts/ContactService";
import { geocodeByCep } from "@/lib/geocoding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Trash2, Edit, Loader2 } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// Otimização: Memoização de linhas da tabela para evitar re-renders desnecessários
const ContactRow = memo(({ contact, onEdit, onDelete }: { contact: any, onEdit: (c: any) => void, onDelete: (id: string) => void }) => (
  <TableRow>
    <TableCell className="font-medium">{contact.name}</TableCell>
    <TableCell>{contact.phone}</TableCell>
    <TableCell>{contact.neighborhood}</TableCell>
    <TableCell className="capitalize">{contact.engagement}</TableCell>
    <TableCell>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(contact)} aria-label="Editar"><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(contact.id)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </TableCell>
  </TableRow>
));
ContactRow.displayName = "ContactRow";

const engagementOptions = [
  { value: "nao_trabalhado", label: "Não trabalhado" },
  { value: "em_prospeccao", label: "Em prospecção" },
  { value: "conquistado", label: "Conquistado" },
  { value: "criando_envolvimento", label: "Criando envolvimento" },
  { value: "falta_trabalhar", label: "Falta trabalhar" },
  { value: "envolvimento_perdido", label: "Envolvimento perdido" },
];

const genderOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

const defaultContact = {
  name: "", nickname: "", gender: "", birth_date: "",
  phone: "", has_whatsapp: false, cep: "", address: "",
  address_number: "", neighborhood: "", city: "Boa Vista", state: "RR",
  voting_zone: "", voting_section: "", voting_location: "",
  engagement: "nao_trabalhado" as const, is_leader: false,
  leader_id: "",
};

export default function Contacts() {
  const { tenantId, user, hasRole, profile } = useAuth();
  const { contactLimit } = useSubscription();
  const [search, setSearch] = useState("");
  const { contacts, totalContacts, loading: contactsLoading, refresh, deleteContact } = useContacts(tenantId, search);

  const [leaders, setLeaders] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultContact);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  
  const tableRef = useRef<HTMLTableElement>(null);
  const isOperador = hasRole("operador");

  useEffect(() => {
    const fetchLeaders = async () => {
      if (!tenantId) return;
      const { data } = await ContactService.fetchLeaders(tenantId);
      setLeaders(data || []);
      if (isOperador && profile?.full_name) {
        const matched = (data || []).find(l => l.name.toLowerCase() === profile.full_name.toLowerCase());
        if (matched) setForm(p => ({ ...p, leader_id: matched.id }));
      }
    };
    fetchLeaders();
  }, [tenantId, isOperador, profile?.full_name]);

  const handleCepBlur = async () => {
    if (!form.cep || form.cep.replace(/\D/g, "").length !== 8) return;
    setGeocoding(true);
    const result = await geocodeByCep(form.cep);
    if (result) {
      setForm((prev) => ({
        ...prev,
        address: result.address || prev.address,
        neighborhood: result.neighborhood || prev.neighborhood,
        city: result.city || prev.city,
        state: result.state || prev.state,
      }));
      setGeoCoords({ latitude: result.latitude || null, longitude: result.longitude || null });
    }
    setGeocoding(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }

    let effectiveTenantId = tenantId || profile?.tenant_id || null;
    if (!effectiveTenantId && user?.id) {
      const { data } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();
      effectiveTenantId = data?.tenant_id || null;
    }
    if (!effectiveTenantId) { toast.error("Não foi possível identificar seu gabinete. Faça logout e entre novamente."); return; }

    if (!editingId && contactLimit !== Infinity && totalContacts >= contactLimit) {
      toast.error(`Limite de ${contactLimit.toLocaleString()} contatos atingido.`);
      return;
    }

    setLoading(true);
    const payload = {
      ...form,
      tenant_id: effectiveTenantId,
      registered_by: user?.id,
      latitude: geoCoords.latitude,
      longitude: geoCoords.longitude,
    };

    const { error } = await ContactService.saveContact(payload, editingId);
    if (error) toast.error(error.message);
    else {
      toast.success(editingId ? "Contato atualizado!" : "Contato cadastrado!");
      setIsOpen(false);
      setForm(defaultContact);
      setEditingId(null);
      refresh();
    }
    setLoading(false);
  };

  const handleEdit = (contact: any) => {
    setForm({
      name: contact.name || "", nickname: contact.nickname || "",
      gender: contact.gender || "", birth_date: contact.birth_date || "",
      phone: contact.phone || "", has_whatsapp: contact.has_whatsapp || false,
      cep: contact.cep || "", address: contact.address || "",
      address_number: contact.address_number || "", neighborhood: contact.neighborhood || "",
      city: contact.city || "Boa Vista", state: contact.state || "RR",
      voting_zone: contact.voting_zone || "", voting_section: contact.voting_section || "",
      voting_location: contact.voting_location || "",
      engagement: contact.engagement || "nao_trabalhado",
      is_leader: contact.is_leader || false,
      leader_id: contact.leader_id || "",
    });
    setEditingId(contact.id);
    setIsOpen(true);
  };

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cadastro &gt; Contato</h1>
        <div className="flex gap-2">
          <ExportButtons tableRef={tableRef} title="Contatos" filename="contatos" />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setForm(defaultContact); setEditingId(null); setIsOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> NOVO CADASTRO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Contato" : "Novo Cadastro"}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="dados">Dados gerais</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                </TabsList>
                <TabsContent value="dados" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Apelido</Label>
                      <Input value={form.nickname} onChange={(e) => updateField("nickname", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Liderança</Label>
                      <Select value={form.leader_id} onValueChange={(v) => updateField("leader_id", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {leaders.map((l) => (
                            <SelectItem key={l.id} value={l.id}>{l.nickname || l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sexo</Label>
                      <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                        <SelectContent>
                          {genderOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Celular</Label>
                      <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Checkbox checked={form.has_whatsapp} onCheckedChange={(c) => updateField("has_whatsapp", c)} id="whats" />
                      <Label htmlFor="whats">Whats?</Label>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="endereco" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>CEP {geocoding && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
                      <Input value={form.cep} onChange={(e) => updateField("cep", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Logradouro</Label>
                      <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input value={form.address_number} onChange={(e) => updateField("address_number", e.target.value)} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar contato..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum contato</TableCell></TableRow>
              ) : contacts.map((c) => (
                <ContactRow 
                  key={c.id} 
                  contact={c} 
                  onEdit={handleEdit} 
                  onDelete={deleteContact} 
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
