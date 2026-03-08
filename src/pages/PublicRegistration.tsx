import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { CheckCircle, Loader2, CheckCircle2, XCircle, User, MapPin, Vote } from "lucide-react";
import logoRadar from "@/assets/logo-radar-eleitoral.png";
import { geocodeByCep } from "@/lib/geocoding";

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

type Step = "dados" | "endereco" | "politico";
const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "dados", label: "Dados Pessoais", icon: <User className="h-4 w-4" /> },
  { key: "endereco", label: "Endereço", icon: <MapPin className="h-4 w-4" /> },
  { key: "politico", label: "Dados Políticos", icon: <Vote className="h-4 w-4" /> },
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
  const [geocoding, setGeocoding] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [cpfStatus, setCpfStatus] = useState<{ valid: boolean | null; message: string; loading: boolean }>({ valid: null, message: "", loading: false });
  const [currentStep, setCurrentStep] = useState<Step>("dados");

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
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

  const [form, setForm] = useState({
    name: "", nickname: "", cpf: "", gender: "", birth_date: "",
    phone: "", has_whatsapp: false,
    cep: "", address: "", address_number: "", neighborhood: "",
    city: "Boa Vista", state: "RR",
    voting_zone: "", voting_section: "", voting_location: "",
    engagement: "nao_trabalhado",
  });

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

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
          const { data: leader } = await supabase.from("contacts_decrypted").select("name, nickname").eq("id", link.leader_contact_id).maybeSingle();
          if (leader) setLeaderName(leader.nickname || leader.name);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const goNext = () => {
    if (currentStep === "dados") {
      if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
      const cleanedCpf = form.cpf.replace(/\D/g, "");
      if (!cleanedCpf || cleanedCpf.length !== 11) { toast.error("CPF é obrigatório"); return; }
      if (cpfStatus.valid === false) { toast.error("CPF inválido"); return; }
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].key);
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const cleanedCpf = form.cpf.replace(/\D/g, "");
    if (!cleanedCpf || cleanedCpf.length !== 11) { toast.error("CPF é obrigatório"); return; }
    if (cpfStatus.valid === false) { toast.error("CPF inválido"); return; }
    if (cpfStatus.loading) { toast.error("Aguarde a validação do CPF"); return; }
    setSaving(true);
    const { error } = await supabase.from("contacts").insert({
      name: form.name,
      nickname: form.nickname || null,
      cpf: form.cpf || null,
      gender: form.gender || null,
      birth_date: form.birth_date || null,
      phone: form.phone || null,
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
      engagement: form.engagement as any,
      tenant_id: tenantId,
      leader_id: leaderContactId,
      is_leader: false,
      latitude: geoCoords.latitude,
      longitude: geoCoords.longitude,
    });
    if (error) toast.error(error.message);
    else setSubmitted(true);
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!tenantId) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="py-10 space-y-3">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-lg font-semibold">Link inválido ou expirado</p>
          <p className="text-sm text-muted-foreground">Solicite um novo link ao responsável.</p>
        </CardContent>
      </Card>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-4">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Cadastro realizado!</h2>
            <p className="text-sm text-muted-foreground">Obrigado por se cadastrar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <img src={logoRadar} alt="Radar Eleitoral" className="h-7 w-7 rounded" />
          <span className="font-bold text-base">RADAR ELEITORAL</span>
        </div>
        {tenantName && <p className="text-center text-sm font-medium mt-1">{tenantName}</p>}
        {leaderName && <p className="text-center text-xs text-muted-foreground">Liderança: <strong>{leaderName}</strong></p>}
      </div>

      {/* Stepper */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (i < currentStepIndex) setCurrentStep(step.key);
                }}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
                  i === currentStepIndex
                    ? "text-primary"
                    : i < currentStepIndex
                    ? "text-green-500"
                    : "text-muted-foreground/40"
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  i === currentStepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < currentStepIndex
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-muted-foreground/30 bg-muted"
                }`}>
                  {i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-[10px] font-medium leading-tight text-center">{step.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-full mx-1 mt-[-12px] ${i < currentStepIndex ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="px-4 pb-32 max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Step: Dados Pessoais */}
          {currentStep === "dados" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Seu nome completo" className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label>Apelido</Label>
                <Input value={form.nickname} onChange={(e) => update("nickname", e.target.value)} placeholder="Como prefere ser chamado" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => {
                    const formatted = formatCpf(e.target.value);
                    update("cpf", formatted);
                    setCpfStatus({ valid: null, message: "", loading: false });
                  }}
                  onBlur={() => validateCpf(form.cpf)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="h-11"
                  inputMode="numeric"
                />
                {cpfStatus.valid === true && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {cpfStatus.message}</p>
                )}
                {cpfStatus.valid === false && (
                  <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> {cpfStatus.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} className="h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => update("phone", formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="h-11"
                  inputMode="tel"
                />
              </div>
              <div className="flex items-center gap-3 py-1">
                <Checkbox checked={form.has_whatsapp} onCheckedChange={(c) => update("has_whatsapp", !!c)} id="whats" />
                <Label htmlFor="whats" className="text-sm">Este número tem WhatsApp</Label>
              </div>
            </div>
          )}

          {/* Step: Endereço */}
          {currentStep === "endereco" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>CEP {geocoding && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
                <Input
                  value={form.cep}
                  onChange={(e) => update("cep", formatCep(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className="h-11"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>Logradouro</Label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, Av..." className="h-11" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={form.address_number} onChange={(e) => update("address_number", e.target.value)} placeholder="Nº" className="h-11" inputMode="numeric" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Bairro</Label>
                  <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} className="h-11" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Cidade</Label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input value={form.state} onChange={(e) => update("state", e.target.value)} maxLength={2} className="h-11" />
                </div>
              </div>
            </div>
          )}

          {/* Step: Dados Políticos */}
          {currentStep === "politico" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Envolvimento</Label>
                <Select value={form.engagement} onValueChange={(v) => update("engagement", v)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {engagementOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Zona Eleitoral</Label>
                  <Input value={form.voting_zone} onChange={(e) => update("voting_zone", e.target.value)} className="h-11" inputMode="numeric" />
                </div>
                <div className="space-y-2">
                  <Label>Seção Eleitoral</Label>
                  <Input value={form.voting_section} onChange={(e) => update("voting_section", e.target.value)} className="h-11" inputMode="numeric" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local de Votação</Label>
                <Input value={form.voting_location} onChange={(e) => update("voting_location", e.target.value)} placeholder="Ex: Escola Municipal..." className="h-11" />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Bottom navigation fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStepIndex > 0 && (
            <Button type="button" variant="outline" onClick={goPrev} className="flex-1 h-12 text-base">
              Voltar
            </Button>
          )}
          {currentStepIndex < steps.length - 1 ? (
            <Button type="button" onClick={goNext} className="flex-1 h-12 text-base">
              Próximo
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit as any} disabled={saving} className="flex-1 h-12 text-base">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</> : "Cadastrar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}