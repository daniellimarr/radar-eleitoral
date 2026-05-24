import React, { memo, useMemo } from "react";
import {
  Home, Users, FileText, Calendar, Car, Package, MapPin, Settings,
  BarChart3, ClipboardList, Link2, MessageSquare, LogOut, ChevronDown, Shield,
  Flag, Megaphone, Database, FolderDown, Building2, DollarSign, MessageCircle, Layers
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, module: "dashboard" },
  { title: "Inteligência de Campo", group: true, items: [
    { title: "Minha Base", url: "/contacts", icon: Users, module: "contacts" },
    { title: "Rede de Lideranças", url: "/leaders", icon: BarChart3, module: "leaders" },
    { title: "Mapeamento de Votos", url: "/map", icon: MapPin, module: "map" },
    { title: "Captação Digital", url: "/registration-links", icon: Link2, module: "registration_links" },
  ]},
  { title: "Operação Gabinete", group: true, items: [
    { title: "Demandas", url: "/demands", icon: ClipboardList, module: "demands" },
    { title: "Agenda Social", url: "/appointments", icon: Calendar, module: "appointments" },
    { title: "Solicitações", url: "/visit-requests", icon: MessageSquare, module: "visit_requests" },
  ]},
  { title: "Expansão e Impacto", group: true, items: [
    { title: "Marketing e Mobilização", url: "/marketing", icon: Megaphone, module: "marketing" },
    { title: "Arquivos Estratégicos", url: "/campaign-files", icon: FolderDown, module: "campaign_files" },
    { title: "WhatsApp Inteligente", url: "/whatsapp", icon: MessageCircle, module: "whatsapp" },
    { title: "Comunicação Interna", url: "/chat", icon: MessageSquare, module: "chat" },
  ]},
  { title: "Logística e Finanças", group: true, items: [
    { title: "Financeiro", url: "/financial", icon: DollarSign, module: "financial" },
    { title: "Veículos", url: "/vehicles", icon: Car, module: "vehicles" },
    { title: "Materiais", url: "/materials", icon: Package, module: "materials" },
  ]},
];

const adminItems = [
  { title: "Plataforma Master", url: "/admin", icon: Shield },
  { title: "Gestão de Gabinetes", url: "/admin/tenants", icon: Building2 },
  { title: "Planos e Cobrança", url: "/admin/plans", icon: Package },
  { title: "Audit Log / Relatórios", url: "/reports", icon: BarChart3 },
];

const configItems = [
  { title: "Backup", url: "/backup", icon: Database },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export const AppSidebar = memo(React.forwardRef<HTMLDivElement>(function AppSidebar(_props, ref) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, hasRole, hasPermission, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  
  const isSuperAdmin = useMemo(() => hasRole("super_admin"), [hasRole]);
  const isAdminGabinete = useMemo(() => hasRole("admin_gabinete"), [hasRole]);
  const isCoordinator = useMemo(() => hasRole("coordenador") || isAdminGabinete || isSuperAdmin, [hasRole, isAdminGabinete, isSuperAdmin]);

  const renderMenuItem = (item: any) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)}>
        <NavLink to={item.url} end className="hover:bg-sidebar-accent transition-colors" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold">
          <item.icon className="h-4 w-4" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar ref={ref} collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shrink-0 shadow-lg shadow-primary/20">
              <img src={logoRadar} alt="Radar Eleitoral" className="h-6 w-6 invert brightness-0" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-lg text-sidebar-foreground leading-tight tracking-tighter">RADAR</span>
                <span className="text-[10px] font-bold text-primary tracking-[0.2em] -mt-1">ELEITORAL</span>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Summary */}
        {!collapsed && (
          <div className="px-6 mb-6">
            <div className="bg-sidebar-accent/50 p-3 rounded-xl border border-sidebar-border/50 flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-sidebar-foreground truncate uppercase tracking-wider">{profile?.full_name || "Usuário"}</p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate font-medium">
                  {isSuperAdmin ? "SUPER ADMIN" : isAdminGabinete ? "ADMINISTRADOR" : "OPERADOR"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu Groups */}
        <div className="px-3 space-y-4">
          {mainItems.map((group) => (
            <SidebarGroup key={group.title} className="p-0">
              {group.group ? (
                <>
                  {!collapsed && <SidebarGroupLabel className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.15em] mb-1">{group.title}</SidebarGroupLabel>}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items
                        .filter((item: any) => hasPermission(item.module))
                        .map((item: any) => renderMenuItem(item))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </>
              ) : (
                hasPermission(group.module) && (
                  <SidebarGroupContent>
                    <SidebarMenu>{renderMenuItem(group)}</SidebarMenu>
                  </SidebarGroupContent>
                )
              )}
            </SidebarGroup>
          ))}

          {/* Admin Section */}
          {isSuperAdmin && (
            <SidebarGroup className="p-0 mt-6 pt-6 border-t border-sidebar-border">
              {!collapsed && <SidebarGroupLabel className="px-3 text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-1">Painel Master</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => renderMenuItem(item))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Configuration Group */}
          {(isSuperAdmin || isAdminGabinete) && (
            <SidebarGroup className="p-0 pt-6">
              {!collapsed && <SidebarGroupLabel className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.15em] mb-1">Sistema</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {configItems.map((item) => renderMenuItem(item))}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
                      <NavLink to="/admin/users" end className="hover:bg-sidebar-accent transition-colors" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-semibold">
                        <Users className="h-4 w-4" />
                        {!collapsed && <span>Gestão de Usuários</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 px-3" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="font-semibold text-xs uppercase tracking-wider">Sair do Sistema</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}));