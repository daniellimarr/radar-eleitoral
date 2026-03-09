import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Trash2, Edit, Loader2, CheckCircle2, XCircle } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { geocodeByCep } from "@/lib/geocoding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [contacts, setContacts] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultContact);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [cpfStatus, setCpfStatus] = useState<{ valid: boolean | null; message: string; loading: boolean }>({ valid: null, message: "", loading: false });
  const tableRef = useRef<HTMLTableElement>(null);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const validateCpf = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length !== 11) {
      setCpfStatus({ valid: null, message: "", loading: false });
      return;
    }
    if (/^(\d)\1{10}$/.test(cleaned)) {
      setCpfStatus({ valid: false, message: "CPF inválido", loading: false });
      return;
    }
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
    let rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    if (rem !== parseInt(cleaned[9])) {
      setCpfStatus({ valid: false, message: "CPF inválido", loading: false });
      return;
    }
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
    rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    if (rem !== parseInt(cleaned[10])) {
      setCpfStatus({ valid: false, message: "CPF inválido", loading: false });
      return;
    }
    setCpfStatus({ valid: true, message: "CPF válido", loading: false });
  };

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

  const isOperador = hasRole("operador");

  const fetchLeaders = async () => {
    if (!tenantId) return;

    if (isOperador && profile?.full_name) {
      // Operators: query leaders table (accessible via RLS) joined with contact info
      const { data: leadersData } = await supabase
        .from("leaders")
        .select("id, contact_id, contacts:contact_id(id, name, nickname)")
        .eq("tenant_id", tenantId);

      const allLeaders = (leadersData || []).map((l: any) => ({
        id: l.contact_id,
        name: l.contacts?.name || "",
        nickname: l.contacts?.nickname || "",
      }));

      const matched = allLeaders.filter(
        (l: any) => l.name.toLowerCase() === profile.full_name.toLowerCase() ||
               (l.nickname && l.nickname.toLowerCase() === profile.full_name.toLowerCase())
      );
      setLeaders(matched);
      if (matched.length >= 1) {
        setForm((prev) => ({ ...prev, leader_id: matched[0].id }));
      }
    } else {
      const { data } = await supabase
        .from("contacts_decrypted")
        .select("id, name, nickname")
        .eq("tenant_id", tenantId)
        .eq("is_leader", true)
        .is("deleted_at", null)
        .order("name");
      setLeaders(data || []);
    }
  };

  useEffect(() => { fetchLeaders(); }, [tenantId, profile?.full_name]);

  const fetchContacts = async () => {
    if (!tenantId) return;
    let query = supabase
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data } = await query;
    setContacts(data || []);
  };

  useEffect(() => { fetchContacts(); }, [tenantId, search]);

  const handleSave = async () => {
    const trimmedName = form.name?.trim();
    if (!tenantId || !trimmedName) {
      toast.error("Nome é obrigatório");
      return;
    }
    const cleanedCpf = form.cpf.replace(/\D/g, "");
    if (!cleanedCpf || cleanedCpf.length !== 11) {
      toast.error("CPF é obrigatório e deve ter 11 dígitos");
      return;
    }
    if (cpfStatus.valid === false) {
      toast.error("CPF inválido. Corrija antes de salvar.");
      return;
    }
    if (cpfStatus.loading) {
      toast.error("Aguarde a validação do CPF.");
      return;
    }
    setLoading(true);



    const payload = {
      name: trimmedName,
      nickname: form.nickname || null,
      cpf: form.cpf || null,
      gender: form.gender || null,
      birth_date: form.birth_date || null,
      phone: form.phone || null,
      has_whatsapp: form.has_whatsapp,
      email: form.email || null,
      cep: form.cep || null,
      address: form.address || null,
      address_number: form.address_number || null,
      neighborhood: form.neighborhood || null,
      city: form.city || null,
      state: form.state || null,
      voting_zone: form.voting_zone || null,
      voting_section: form.voting_section || null,
      voting_location: form.voting_location || null,
      engagement: form.engagement as "nao_trabalhado" | "em_prospeccao" | "conquistado" | "criando_envolvimento" | "falta_trabalhar" | "envolvimento_perdido",
      is_leader: form.is_leader,
      observations: form.observations || null,
      category: form.category || null,
      subcategory: form.subcategory || null,
      leader_id: form.leader_id || null,
      tenant_id: tenantId,
      registered_by: user?.id,
      latitude: geoCoords.latitude,
      longitude: geoCoords.longitude,
    };

    if (editingId) {
      const { error } = await supabase.from("contacts").update(payload).eq("id", editingId);
      if (error) toast.error(error.message);
      else toast.success("Contato atualizado!");
    } else {
      // Check contact limit before inserting
      if (contactLimit !== Infinity && contacts.length >= contactLimit) {
        toast.error(`Limite de ${contactLimit.toLocaleString()} contatos atingido. Faça upgrade do seu plano.`);
        setLoading(false);
        return;
      }
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Contato cadastrado!");
    }

    setLoading(false);
    setIsOpen(false);
    setForm(defaultContact);
    setEditingId(null);
    fetchContacts();
  };

  const handleEdit = (contact: any) => {
    setForm({
      name: contact.name || "", nickname: contact.nickname || "", cpf: contact.cpf || "",
      gender: contact.gender || "", birth_date: contact.birth_date || "",
      phone: contact.phone || "", has_whatsapp: contact.has_whatsapp || false,
      email: contact.email || "", cep: contact.cep || "", address: contact.address || "",
      address_number: contact.address_number || "", neighborhood: contact.neighborhood || "",
      city: contact.city || "Boa Vista", state: contact.state || "RR",
      voting_zone: contact.voting_zone || "", voting_section: contact.voting_section || "",
      voting_location: contact.voting_location || "",
      engagement: contact.engagement || "nao_trabalhado",
      is_leader: contact.is_leader || false, observations: contact.observations || "",
      category: contact.category || "", subcategory: contact.subcategory || "",
      leader_id: contact.leader_id || "",
    });
    setEditingId(contact.id);
    setCpfStatus({ valid: null, message: "", loading: false });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contacts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Contato removido"); fetchContacts(); }
  };

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cadastro &gt; Contato</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(defaultContact); setEditingId(null); setCpfStatus({ valid: null, message: "", loading: false }); }}>
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
                    <Label>Liderança (Apelido)</Label>
                    {isOperador ? (
                      <Input value={profile?.full_name || "Liderança"} disabled />
                    ) : (
                      <Select value={form.leader_id} onValueChange={(v) => updateField("leader_id", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {leaders.map((l) => (
                            <SelectItem key={l.id} value={l.id}>{l.nickname || l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input
                      value={form.cpf}
                      onChange={(e) => {
                        const formatted = formatCpf(e.target.value);
                        updateField("cpf", formatted);
                        setCpfStatus({ valid: null, message: "", loading: false });
                      }}
                      onBlur={() => validateCpf(form.cpf)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {cpfStatus.loading && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Validando CPF...
                      </p>
                    )}
                    {cpfStatus.valid === true && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {cpfStatus.message}
                      </p>
                    )}
                    {cpfStatus.valid === false && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> {cpfStatus.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Sexo *</Label>
                    <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                      <SelectContent>
                        {genderOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Zona</Label>
                    <Input value={form.voting_zone} onChange={(e) => updateField("voting_zone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seção</Label>
                    <Input value={form.voting_section} onChange={(e) => updateField("voting_section", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Local onde vota</Label>
                    <Input value={form.voting_location} onChange={(e) => updateField("voting_location", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Dt. nasc.</Label>
                    <Input type="date" value={form.birth_date} onChange={(e) => updateField("birth_date", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox checked={form.is_leader} onCheckedChange={(c) => updateField("is_leader", c)} id="leader" />
                    <Label htmlFor="leader">Liderança</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Envolvimento</Label>
                    <Select value={form.engagement} onValueChange={(v) => updateField("engagement", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {engagementOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Celular *</Label>
                    <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox checked={form.has_whatsapp} onCheckedChange={(c) => updateField("has_whatsapp", c)} id="whats" />
                    <Label htmlFor="whats">Whats?</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input value={form.category} onChange={(e) => updateField("category", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subcategoria</Label>
                    <Input value={form.subcategory} onChange={(e) => updateField("subcategory", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea value={form.observations} onChange={(e) => updateField("observations", e.target.value)} rows={4} />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input value={form.neighborhood} onChange={(e) => updateField("neighborhood", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Pesquisar contato..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ExportButtons tableRef={tableRef} title="Contatos" filename="contatos" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Envolvimento</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum contato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded bg-accent text-accent-foreground">
                        {engagementOptions.find(e => e.value === c.engagement)?.label || c.engagement}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!hasRole("operador") && (
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {(hasRole("super_admin") || hasRole("admin_gabinete")) && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
