import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useElectoralMap, ElectoralSectionRow } from "@/hooks/useElectoralMap";
import { ImportTseDialog } from "@/components/features/electoral/ImportTseDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MapPin, Building2, Users, Target, Download, ChevronDown, Pencil, Search } from "lucide-react";

interface ZoneGroup {
  zone: string;
  city: string | null;
  sections: ElectoralSectionRow[];
  voters: number;
  contacts: number;
}

export default function ElectoralMap() {
  const { tenantId } = useAuth();
  const { data, isLoading, refresh } = useElectoralMap(tenantId);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ElectoralSectionRow | null>(null);
  const [goal, setGoal] = useState("");
  const [lastVotes, setLastVotes] = useState("");

  const sections = data || [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    return sections.filter((s) =>
      [s.zone, s.section, s.location_name, s.neighborhood, s.city]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [sections, search]);

  const totals = useMemo(() => ({
    zones: new Set(filtered.map((s) => s.zone)).size,
    sections: filtered.length,
    voters: filtered.reduce((sum, s) => sum + (s.registered_voters || 0), 0),
    contacts: filtered.reduce((sum, s) => sum + Number(s.contacts_count || 0), 0),
    goal: filtered.reduce((sum, s) => sum + (s.vote_goal || 0), 0),
  }), [filtered]);

  const groups = useMemo<ZoneGroup[]>(() => {
    const map = new Map<string, ZoneGroup>();
    filtered.forEach((s) => {
      const g = map.get(s.zone) || { zone: s.zone, city: s.city, sections: [], voters: 0, contacts: 0 };
      g.sections.push(s);
      g.voters += s.registered_voters || 0;
      g.contacts += Number(s.contacts_count || 0);
      map.set(s.zone, g);
    });
    return [...map.values()].sort((a, b) => a.zone.localeCompare(b.zone));
  }, [filtered]);

  const openEdit = (row: ElectoralSectionRow) => {
    setEditing(row);
    setGoal(row.vote_goal != null ? String(row.vote_goal) : "");
    setLastVotes(row.last_election_votes != null ? String(row.last_election_votes) : "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("electoral_sections")
      .update({
        vote_goal: goal.trim() === "" ? null : Number(goal),
        last_election_votes: lastVotes.trim() === "" ? null : Number(lastVotes),
      })
      .eq("id", editing.id);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Seção atualizada.");
    setEditing(null);
    refresh();
  };

  const statCards = [
    { label: "Zonas eleitorais", value: totals.zones, icon: MapPin },
    { label: "Seções mapeadas", value: totals.sections, icon: Building2 },
    { label: "Eleitores aptos", value: totals.voters, icon: Users },
    { label: "Contatos cadastrados", value: totals.contacts, icon: Target },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-7 w-7 text-primary" />
            Mapa Eleitoral
          </h1>
          <p className="text-sm text-muted-foreground">Zonas e seções eleitorais do TSE</p>
        </div>
        <Button onClick={() => setImportOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Importar do TSE
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5 space-y-1">
              <card.icon className="h-5 w-5 text-primary" />
              <p className="text-3xl font-bold">{card.value.toLocaleString("pt-BR")}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por zona, seção, local ou bairro"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando mapa eleitoral...</p>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-medium">Nenhuma seção eleitoral cadastrada</p>
            <p className="text-sm text-muted-foreground">
              Importe as zonas e seções do TSE para começar a cruzar seus contatos.
            </p>
            <Button onClick={() => setImportOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Importar do TSE
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Collapsible key={group.zone} defaultOpen={groups.length <= 3}>
              <Card>
                <CollapsibleTrigger className="w-full text-left">
                  <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono">{group.zone}</Badge>
                      <div>
                        <CardTitle className="text-base">
                          Zona {group.zone}
                          {group.city ? ` · ${group.city}` : ""}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {group.sections.length} seções · {group.voters.toLocaleString("pt-BR")} eleitores aptos ·{" "}
                          {group.contacts.toLocaleString("pt-BR")} cadastrados
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-muted-foreground border-b">
                          <th className="text-left py-2 pr-3">Seção</th>
                          <th className="text-left py-2 pr-3">Local de votação</th>
                          <th className="text-left py-2 pr-3">Bairro</th>
                          <th className="text-right py-2 pr-3">Eleitores</th>
                          <th className="text-right py-2 pr-3">Cadastrados</th>
                          <th className="text-right py-2 pr-3">Cobertura</th>
                          <th className="text-right py-2 pr-3">Última eleição</th>
                          <th className="text-right py-2 pr-3">Meta</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.sections.map((s) => {
                          const coverage = s.registered_voters > 0
                            ? Math.min((Number(s.contacts_count) / s.registered_voters) * 100, 100)
                            : 0;
                          return (
                            <tr key={s.id} className="border-b last:border-0">
                              <td className="py-2 pr-3 font-mono font-medium">{s.section}</td>
                              <td className="py-2 pr-3">{s.location_name || "—"}</td>
                              <td className="py-2 pr-3 text-muted-foreground">{s.neighborhood || "—"}</td>
                              <td className="py-2 pr-3 text-right font-medium">
                                {s.registered_voters.toLocaleString("pt-BR")}
                              </td>
                              <td className="py-2 pr-3 text-right">
                                {Number(s.contacts_count).toLocaleString("pt-BR")}
                              </td>
                              <td className="py-2 pr-3 text-right w-32">
                                <Progress value={coverage} className="h-2" />
                                <span className="text-[10px] text-muted-foreground">
                                  {coverage.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-2 pr-3 text-right">
                                {s.last_election_votes?.toLocaleString("pt-BR") ?? "—"}
                              </td>
                              <td className="py-2 pr-3 text-right">
                                {s.vote_goal?.toLocaleString("pt-BR") ?? "—"}
                              </td>
                              <td className="py-2 text-right">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      <ImportTseDialog open={importOpen} onOpenChange={setImportOpen} onImported={refresh} />

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              Zona {editing?.zone} · Seção {editing?.section}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {editing?.location_name || "Local não informado"}
              {editing?.address ? ` — ${editing.address}` : ""}
            </p>
            <div className="space-y-2">
              <Label htmlFor="last-votes">Votos na última eleição</Label>
              <Input
                id="last-votes"
                type="number"
                min={0}
                value={lastVotes}
                onChange={(e) => setLastVotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Meta de votos</Label>
              <Input
                id="goal"
                type="number"
                min={0}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
