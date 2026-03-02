import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Cloud, CheckCircle } from "lucide-react";

export default function PublicRegistration() {
  const { slug } = useParams();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", city: "", neighborhood: "",
    has_whatsapp: false, birth_date: "",
  });

  const [leaderContactId, setLeaderContactId] = useState<string | null>(null);
  const [leaderName, setLeaderName] = useState("");

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
    if (!tenantId || !form.name || !form.phone) { toast.error("Nome e celular são obrigatórios"); return; }
    setSaving(true);
    const { error } = await supabase.from("contacts").insert({
      ...form, tenant_id: tenantId, birth_date: form.birth_date || null,
      leader_id: leaderContactId,
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
      <Card className="max-w-lg w-full">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Celular *</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} required /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.has_whatsapp} onCheckedChange={(c) => setForm(p => ({ ...p, has_whatsapp: !!c }))} />
              <span className="text-sm">Tem WhatsApp?</span>
            </div>
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Data de nascimento</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm(p => ({ ...p, birth_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Bairro</Label><Input value={form.neighborhood} onChange={(e) => setForm(p => ({ ...p, neighborhood: e.target.value }))} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Enviando..." : "Cadastrar"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
