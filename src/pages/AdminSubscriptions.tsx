import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, DollarSign, TrendingUp, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  tenant_id: string;
  user_id: string;
  plan_name: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  next_due_date: string | null;
  tenant_name?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700" },
  overdue: { label: "Inadimplente", className: "bg-amber-100 text-amber-700" },
  pending: { label: "Pendente", className: "bg-blue-100 text-blue-700" },
};

export default function AdminSubscriptions() {
  const { hasRole } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = hasRole("super_admin");

  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchData = async () => {
      setLoading(true);

      const [subsRes, tenantsRes] = await Promise.all([
        supabase.from("subscriptions").select("*").order("started_at", { ascending: false }),
        supabase.from("tenants").select("id, name").is("deleted_at", null),
      ]);

      const tenantsMap = new Map(
        (tenantsRes.data || []).map((t: any) => [t.id, t.name])
      );

      const data = (subsRes.data || []).map((s: any) => ({
        ...s,
        tenant_name: tenantsMap.get(s.tenant_id) || "—",
      }));

      setSubscriptions(data);
      setLoading(false);
    };
    fetchData();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const cancelledSubs = subscriptions.filter((s) => s.status === "cancelled");
  const overdueSubs = subscriptions.filter((s) => s.status === "overdue");

  // Revenue calculation based on plan names from ASAAS_PLANS
  const planPriceMap: Record<string, number> = {
    mensal: 97,
    trimestral: 247,
    anual: 697,
  };

  const totalMRR = activeSubs.reduce((sum, s) => {
    const key = s.plan_name?.toLowerCase();
    if (key === "trimestral") return sum + 247 / 3;
    if (key === "anual") return sum + 697 / 12;
    return sum + (planPriceMap[key] || 0);
  }, 0);

  const totalRevenue = subscriptions
    .filter((s) => s.status === "active" || s.status === "cancelled")
    .reduce((sum, s) => {
      const key = s.plan_name?.toLowerCase();
      return sum + (planPriceMap[key] || 0);
    }, 0);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return format(new Date(d), "dd/MM/yyyy");
  };

  const renderStatus = (status: string) => {
    const s = STATUS_MAP[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const SubTable = ({ subs }: { subs: Subscription[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Gabinete</TableHead>
          <TableHead>Plano</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Início</TableHead>
          <TableHead>Próx. Cobrança</TableHead>
          <TableHead>Cancelado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              Nenhuma assinatura encontrada
            </TableCell>
          </TableRow>
        ) : (
          subs.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.tenant_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{s.plan_name}</Badge>
              </TableCell>
              <TableCell>{renderStatus(s.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(s.started_at)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(s.next_due_date)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(s.cancelled_at)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          Gestão de Assinaturas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe todas as assinaturas da plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="text-2xl font-bold">{activeSubs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Canceladas</p>
              <p className="text-2xl font-bold">{cancelledSubs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRR Estimado</p>
              <p className="text-2xl font-bold">R$ {totalMRR.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inadimplentes</p>
              <p className="text-2xl font-bold">{overdueSubs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todas ({subscriptions.length})</TabsTrigger>
            <TabsTrigger value="active">Ativas ({activeSubs.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas ({cancelledSubs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-0">
                <SubTable subs={subscriptions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardContent className="p-0">
                <SubTable subs={activeSubs} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card>
              <CardContent className="p-0">
                <SubTable subs={cancelledSubs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
