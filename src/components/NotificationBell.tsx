import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { tenantId, hasRole } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const isAdmin = hasRole("super_admin") || hasRole("admin_gabinete") || hasRole("coordenador");

  useEffect(() => {
    if (!tenantId || !isAdmin) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data as Notification[]);
    };

    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.tenant_id === tenantId) {
            setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, isAdmin]);

  if (!isAdmin) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/50 transition-colors ${!n.is_read ? "bg-muted/50" : ""}`}
                onClick={async () => {
                  // Mark as read
                  if (!n.is_read) {
                    await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                    setNotifications((prev) =>
                      prev.map((notif) => notif.id === n.id ? { ...notif, is_read: true } : notif)
                    );
                  }
                  const routes: Record<string, string> = {
                    pending_approval: "/user-management",
                    new_contact: "/contacts",
                    new_visit_request: "/visit-requests",
                    visit_request: "/visit-requests",
                    new_demand: "/demands",
                    new_leader: "/leaders",
                    financial: "/financial",
                    info: "/dashboard",
                  };
                  const route = routes[n.type];
                  if (route) navigate(route);
                  setOpen(false);
                }}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                {!n.is_read && (n.type === "pending_approval" || n.type === "new_visit_request" || n.type === "visit_request" || n.type === "new_contact") && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {n.type === "pending_approval" ? "Clique para aprovar" : "Clique para visualizar"}
                  </span>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
