import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Cloud, CheckCircle } from "lucide-react";

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

export default function PublicRegistration() {
  const { slug } = useParams();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaderContactId, setLeaderContactId] = useState<string | null>(null);
  const [leaderName, setLeaderName] = useState("");

  const [form, setForm] = useState({
    name: "", nickname: "", cpf: "", gender: "", birth_date: "",
    phone: "", has_whatsapp: false, email: "",
    cep: "", address: "", address_number: "", neighborhood: "",
    city: "", state: "SP",
    voting_zone: "", voting_section: "", voting_location: "",
    engagement: "nao_trabalhado",
    category: "", subcategory: "", observations: "",
  });

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: link } = await supabase
        .from("registration_links")
        .select("tenant_id, leader_contact_id")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (link) {
        setTenantId(link.tenant_id);
        setLeaderContactId(link.leader_contact_id);
        const { data: tenant } = await supabase.from("tenants").select("name").eq("id", link.tenant_id).maybeSingle();
        if (tenant) setTenantName(tenant.name);
        if (link.leader_contact_id) {
          const { data: leader } = await supabase.from("contacts").select("name, nickname").eq("id", link.leader_contact_id).maybeSingle();
          if (leader) setLeaderName(leader.nickname || leader.name);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    const { error } = await supabase.from("contacts").insert({
      name: form.name,
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
      engagement: form.engagement as any,
      category: form.category || null,
      subcategory: form.subcategory || null,
      observations: form.observations || null,
      tenant_id: tenantId,
      leader_id: leaderContactId,
      is_leader: false,
    });
    if (error) toast.error(error.message);
    else setSubmitted(true);
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!tenantId) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Link inválido ou expirado.</div>;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold">Cadastro realizado!</h2>
            <p className="text-muted-foreground">Obrigado por se cadastrar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Cloud className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">GABINETE ONLINE</span>
          </div>
          <CardTitle>{tenantName}</CardTitle>
          {leaderName && <p className="text-sm text-muted-foreground">Liderança: <strong>{leaderName}</strong></p>}
          <p className="text-sm text-muted-foreground">Preencha seus dados</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="politico">Dados Políticos</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Apelido</Label>
                    <Input value={form.nickname} onChange={(e) => update("nickname", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Envolvimento</Label>
                    <Select value={form.engagement} onValueChange={(v) => update("engagement", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {engagementOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Celular</Label>
                    <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox checked={form.has_whatsapp} onCheckedChange={(c) => update("has_whatsapp", !!c)} id="whats" />
                    <Label htmlFor="whats">WhatsApp?</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea value={form.observations} onChange={(e) => update("observations", e.target.value)} rows={3} />
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input value={form.cep} onChange={(e) => update("cep", e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Logradouro</Label>
                    <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input value={form.address_number} onChange={(e) => update("address_number", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input value={form.state} onChange={(e) => update("state", e.target.value)} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="politico" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Subcategoria</Label>
                    <Input value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Enviando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
