import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, UserPlus, Trash2, Users, Loader2 } from "lucide-react";
import { geocodeByCep } from "@/lib/geocoding";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Voter {
  id: string;
  name: string;
  phone: string | null;
  neighborhood: string | null;
  voting_zone: string | null;
}

export default function LeaderRegistration() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Leader's contact_id (from leaders table)
  const [leaderContactId, setLeaderContactId] = useState<string | null>(null);

  // Voters state
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [voterDialogOpen, setVoterDialogOpen] = useState(false);
  const [savingVoter, setSavingVoter] = useState(false);
  const [voterForm, setVoterForm] = useState({
    name: "", phone: "", neighborhood: "", voting_zone: "", voting_section: "",
  });
  const [geocoding, setGeocoding] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });

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

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    cpf: "",
    phone: "",
    email: "",
    gender: "",
    birth_date: "",
    has_whatsapp: false,
    cep: "",
    address: "",
    address_number: "",
    neighborhood: "",
    city: "",
    state: "RR",
    voting_zone: "",
    voting_section: "",
    voting_location: "",
    category: "",
    subcategory: "",
    engagement: "nao_trabalhado" as string,
    observations: "",
  });

  useEffect(() => {
    if (!id) return;
    setLoadingData(true);
    const loadLeader = async () => {
      const { data: leader } = await supabase
        .from("leaders")
        .select("id, contact_id")
        .or(`id.eq.${id},contact_id.eq.${id}`)
        .limit(1)
        .single();
      const contactId = leader?.contact_id || id;
      setLeaderContactId(contactId);

      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single();
      if (data) {
        setForm({
          name: data.name || "",
          nickname: data.nickname || "",
          cpf: data.cpf || "",
          phone: data.phone || "",
          email: data.email || "",
          gender: data.gender || "",
          birth_date: data.birth_date || "",
          has_whatsapp: data.has_whatsapp || false,
          cep: data.cep || "",
          address: data.address || "",
          address_number: data.address_number || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "RR",
          voting_zone: data.voting_zone || "",
          voting_section: data.voting_section || "",
          voting_location: data.voting_location || "",
          category: data.category || "",
          subcategory: data.subcategory || "",
          engagement: data.engagement || "nao_trabalhado",
          observations: data.observations || "",
        });
      }
      setLoadingData(false);
    };
    loadLeader();
  }, [id]);

  // Load voters linked to this leader
  const loadVoters = async () => {
    if (!leaderContactId) return;
    setLoadingVoters(true);
    const { data } = await supabase
      .from("contacts")
      .select("id, name, phone, neighborhood, voting_zone")
      .eq("leader_id", leaderContactId)
      .is("deleted_at", null)
      .order("name");
    setVoters(data || []);
    setLoadingVoters(false);
  };

  useEffect(() => {
    if (leaderContactId) loadVoters();
  }, [leaderContactId]);

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!tenantId) {
      toast({ title: "Erro: usuário sem vínculo a um gabinete. Faça login novamente.", variant: "destructive" });
      return;
    }
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const contactData = {
        name: form.name,
        nickname: form.nickname || null,
        cpf: form.cpf || null,
        phone: form.phone || null,
        email: form.email || null,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        has_whatsapp: form.has_whatsapp,
        cep: form.cep || null,
        address: form.address || null,
        address_number: form.address_number || null,
        neighborhood: form.neighborhood || null,
        city: form.city || null,
        state: form.state || null,
        voting_zone: form.voting_zone || null,
        voting_section: form.voting_section || null,
        voting_location: form.voting_location || null,
        category: form.category || null,
        subcategory: form.subcategory || null,
        engagement: form.engagement as any,
        observations: form.observations || null,
        latitude: geoCoords.latitude,
        longitude: geoCoords.longitude,
      };

      if (isEditing) {
        const contactId = leaderContactId || id;
        const { error } = await supabase
          .from("contacts")
          .update(contactData)
          .eq("id", contactId);
        if (error) throw error;
        toast({ title: "Liderança atualizada com sucesso!" });
      } else {
          const { data: contact, error: contactError } = await supabase
            .from("contacts")
            .insert({ ...contactData, tenant_id: tenantId, is_leader: true, latitude: geoCoords.latitude, longitude: geoCoords.longitude })
          .select("id")
          .single();
        if (contactError) throw contactError;

        const { error: leaderError } = await supabase.from("leaders").insert({
          contact_id: contact.id,
          tenant_id: tenantId,
        });
        if (leaderError) throw leaderError;
        toast({ title: "Liderança cadastrada com sucesso!" });
      }

      navigate("/leaders");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Add voter linked to this leader
  const handleAddVoter = async () => {
    if (!tenantId || !leaderContactId) return;
    if (!voterForm.name.trim()) {
      toast({ title: "Nome do eleitor é obrigatório", variant: "destructive" });
      return;
    }
    setSavingVoter(true);
    try {
      const { error } = await supabase.from("contacts").insert({
        name: voterForm.name,
        phone: voterForm.phone || null,
        neighborhood: voterForm.neighborhood || null,
        voting_zone: voterForm.voting_zone || null,
        voting_section: voterForm.voting_section || null,
        tenant_id: tenantId,
        leader_id: leaderContactId,
        is_leader: false,
      });
      if (error) throw error;
      toast({ title: "Eleitor cadastrado com sucesso!" });
      setVoterForm({ name: "", phone: "", neighborhood: "", voting_zone: "", voting_section: "" });
      setVoterDialogOpen(false);
      loadVoters();
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar eleitor", description: err.message, variant: "destructive" });
    } finally {
      setSavingVoter(false);
    }
  };

  const handleRemoveVoter = async (voterId: string) => {
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ leader_id: null })
        .eq("id", voterId);
      if (error) throw error;
      toast({ title: "Eleitor desvinculado" });
      loadVoters();
    } catch (err: any) {
      toast({ title: "Erro ao desvincular", description: err.message, variant: "destructive" });
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leaders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? "Editar Liderança" : "Cadastrar Liderança"}</h1>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="politico">Dados Políticos</TabsTrigger>
          {isEditing && <TabsTrigger value="eleitores" className="gap-1"><Users className="h-4 w-4" /> Eleitores</TabsTrigger>}
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Apelido</Label>
                <Input value={form.nickname} onChange={(e) => update("nickname", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.has_whatsapp} onCheckedChange={(v) => update("has_whatsapp", v)} />
                <Label>Possui WhatsApp</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endereco">
          <Card>
            <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CEP {geocoding && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
                <Input value={form.cep} onChange={(e) => update("cep", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={form.address_number} onChange={(e) => update("address_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={form.state} onChange={(e) => update("state", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="politico">
          <Card>
            <CardHeader><CardTitle>Dados Políticos</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zona Eleitoral</Label>
                <Input value={form.voting_zone} onChange={(e) => update("voting_zone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Seção Eleitoral</Label>
                <Input value={form.voting_section} onChange={(e) => update("voting_section", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Local de Votação</Label>
                <Input value={form.voting_location} onChange={(e) => update("voting_location", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subcategoria</Label>
                <Input value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nível de Envolvimento</Label>
                <Select value={form.engagement} onValueChange={(v) => update("engagement", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_trabalhado">Não Trabalhado</SelectItem>
                    <SelectItem value="em_prospeccao">Em Prospecção</SelectItem>
                    <SelectItem value="conquistado">Conquistado</SelectItem>
                    <SelectItem value="criando_envolvimento">Criando Envolvimento</SelectItem>
                    <SelectItem value="falta_trabalhar">Falta Trabalhar</SelectItem>
                    <SelectItem value="envolvimento_perdido">Envolvimento Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={form.observations} onChange={(e) => update("observations", e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isEditing && (
          <TabsContent value="eleitores">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Eleitores Vinculados ({voters.length})
                </CardTitle>
                <Dialog open={voterDialogOpen} onOpenChange={setVoterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <UserPlus className="h-4 w-4" /> Cadastrar Eleitor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Eleitor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input value={voterForm.name} onChange={(e) => setVoterForm(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Celular</Label>
                        <Input value={voterForm.phone} onChange={(e) => setVoterForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input value={voterForm.neighborhood} onChange={(e) => setVoterForm(p => ({ ...p, neighborhood: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Zona Eleitoral</Label>
                          <Input value={voterForm.voting_zone} onChange={(e) => setVoterForm(p => ({ ...p, voting_zone: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Seção Eleitoral</Label>
                          <Input value={voterForm.voting_section} onChange={(e) => setVoterForm(p => ({ ...p, voting_section: e.target.value }))} />
                        </div>
                      </div>
                      <Button onClick={handleAddVoter} disabled={savingVoter} className="w-full gap-2">
                        <Save className="h-4 w-4" />
                        {savingVoter ? "Salvando..." : "Salvar Eleitor"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingVoters ? (
                  <Skeleton className="h-32 w-full" />
                ) : voters.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum eleitor vinculado a esta liderança.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Celular</TableHead>
                        <TableHead>Bairro</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voters.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell>{v.phone || "—"}</TableCell>
                          <TableCell>{v.neighborhood || "—"}</TableCell>
                          <TableCell>{v.voting_zone || "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveVoter(v.id)} title="Desvincular eleitor">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : isEditing ? "Atualizar Liderança" : "Salvar Liderança"}
        </Button>
      </div>
    </div>
  );
}
