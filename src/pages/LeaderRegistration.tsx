import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LeaderRegistration() {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

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
    state: "SP",
    voting_zone: "",
    voting_section: "",
    voting_location: "",
    category: "",
    subcategory: "",
    engagement: "nao_trabalhado" as string,
    observations: "",
  });

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!tenantId) return;
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Create contact as leader
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert({
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
          tenant_id: tenantId,
          is_leader: true,
        })
        .select("id")
        .single();

      if (contactError) throw contactError;

      // Create leader record
      const { error: leaderError } = await supabase.from("leaders").insert({
        contact_id: contact.id,
        tenant_id: tenantId,
      });

      if (leaderError) throw leaderError;

      toast({ title: "Liderança cadastrada com sucesso!" });
      navigate("/leaders");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leaders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Cadastrar Liderança</h1>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="politico">Dados Políticos</TabsTrigger>
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
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => update("cep", e.target.value)} />
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
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Liderança"}
        </Button>
      </div>
    </div>
  );
}
