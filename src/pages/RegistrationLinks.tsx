import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Copy, Trash2 } from "lucide-react";

export default function RegistrationLinks() {
  const { tenantId, user } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [selectedLeader, setSelectedLeader] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!tenantId) return;
    const [linksRes, leadersRes] = await Promise.all([
      supabase.from("registration_links").select("*, leader:contacts!registration_links_leader_contact_id_fkey(id, name, nickname)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("contacts").select("id, name, nickname").eq("tenant_id", tenantId).eq("is_leader", true).is("deleted_at", null).order("name"),
    ]);
    setLinks(linksRes.data || []);
    setLeaders(leadersRes.data || []);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const handleCreate = async () => {
    if (!tenantId || !slug) { toast.error("Slug é obrigatório"); return; }
    setLoading(true);
    const { error } = await supabase.from("registration_links").insert({
      tenant_id: tenantId,
      slug,
      coordinator_id: user?.id,
      leader_contact_id: selectedLeader || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Link criado!"); setIsOpen(false); setSlug(""); setSelectedLeader(""); fetchData(); }
    setLoading(false);
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/cadastro/${slug}`);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Links de Cadastro</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Link</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Link de Cadastro</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Slug (identificador único)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="meu-link" />
                <p className="text-xs text-muted-foreground">{window.location.origin}/cadastro/{slug || "..."}</p>
              </div>
              <div className="space-y-2">
                <Label>Liderança (opcional)</Label>
                <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma liderança" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (link geral)</SelectItem>
                    {leaders.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nickname || l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Eleitores cadastrados por este link serão vinculados automaticamente à liderança selecionada.</p>
              </div>
              <Button onClick={handleCreate} disabled={loading} className="w-full">{loading ? "Criando..." : "Criar Link"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Liderança</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum link</TableCell></TableRow>
              ) : links.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-sm">/cadastro/{l.slug}</TableCell>
                  <TableCell>{l.leader ? (l.leader.nickname || l.leader.name) : "—"}</TableCell>
                  <TableCell>{l.is_active ? "✅ Ativo" : "❌ Inativo"}</TableCell>
                  <TableCell>{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(l.slug)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("registration_links").delete().eq("id", l.id); fetchData(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
