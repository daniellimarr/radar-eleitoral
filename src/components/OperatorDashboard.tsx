import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, ClipboardList, UserPlus, MapPin, Navigation, Home } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function OperatorDashboard() {
  const { tenantId, profile } = useAuth();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [pendingDemands, setPendingDemands] = useState(0);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      const now = new Date();
      const todayStart = format(now, "yyyy-MM-dd") + "T00:00:00";
      const todayEnd = format(now, "yyyy-MM-dd") + "T23:59:59";

      const [apptRes, demandRes, contactsRes] = await Promise.all([
        supabase.from("appointments").select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId).gte("start_time", todayStart).lte("start_time", todayEnd),
        supabase.from("demands").select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId).in("status", ["aberta", "em_andamento"]),
        supabase.from("contacts").select("id, name, birth_date, created_at")
          .eq("tenant_id", tenantId).is("deleted_at", null)
          .order("created_at", { ascending: false }).limit(10),
      ]);

      setTodayAppointments(apptRes.count || 0);
      setPendingDemands(demandRes.count || 0);
      setRecentContacts(contactsRes.data || []);
    };

    fetchData();
  }, [tenantId]);

  const quickActions = [
    { label: "Novo Contato", icon: UserPlus, path: "/contacts", color: "bg-emerald-100 text-emerald-600" },
    { label: "Solicitar Visita", icon: Navigation, path: "/visit-requests", color: "bg-blue-100 text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Início</h1>
        <div className="flex items-center gap-2 text-sm bg-foreground text-background px-4 py-2 rounded-lg font-medium">
          <CalendarIcon className="h-4 w-4" />
          {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Welcome */}
      <Card>
        <CardContent className="p-6">
          <p className="text-lg">Olá, <strong>{profile?.full_name || "Liderança"}</strong>! Veja seus atalhos rápidos abaixo.</p>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atendimentos hoje</p>
              <p className="text-2xl font-bold">{todayAppointments}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Demandas pendentes</p>
              <p className="text-2xl font-bold">{pendingDemands}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader><CardTitle>Ações rápidas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className={`h-12 w-12 rounded-full ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent contacts */}
      {recentContacts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Meus cadastros</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recentContacts.map((c) => (
                <li key={c.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.birth_date && (
                      <span className="text-xs text-muted-foreground ml-2">
                        🎂 {new Date(c.birth_date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
