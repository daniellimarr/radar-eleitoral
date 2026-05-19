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
  { title: "Início", url: "/dashboard", icon: Home, module: "dashboard" },
  { title: "Campanhas", url: "/campaigns", icon: Flag, module: "campaigns" },
  { title: "Contatos", url: "/contacts", icon: Users, module: "contacts" },
  { title: "Demandas", url: "/demands", icon: ClipboardList, module: "demands" },
  { title: "Agenda", url: "/appointments", icon: Calendar, module: "appointments" },
  { title: "Lideranças", url: "/leaders", icon: BarChart3, module: "leaders" },
  { title: "Financeiro", url: "/financial", icon: DollarSign, module: "financial" },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, module: "whatsapp" },
  { title: "Marketing", url: "/marketing", icon: Megaphone, module: "marketing" },
  { title: "Arquivos", url: "/campaign-files", icon: FolderDown, module: "campaign_files" },
  { title: "Mapa", url: "/map", icon: MapPin, module: "map" },
  { title: "Chat Interno", url: "/chat", icon: MessageSquare, module: "chat" },
];

const coordinatorItems = [
  { title: "Usuários", url: "/admin/users", icon: Users, module: "user_management" },
  { title: "Veículos", url: "/vehicles", icon: Car, module: "vehicles" },
  { title: "Materiais", url: "/materials", icon: Package, module: "materials" },
  { title: "Solicitações", url: "/visit-requests", icon: MessageSquare, module: "visit_requests" },
  { title: "Links de Cadastro", url: "/registration-links", icon: Link2, module: "registration_links" },
];

const adminItems = [
  { title: "Painel da Plataforma", url: "/admin", icon: Shield },
  { title: "Gestão de Gabinetes", url: "/admin/tenants", icon: Building2 },
  { title: "Gestão de Planos", url: "/admin/plans", icon: Package },
  { title: "Relatórios e Auditoria", url: "/reports", icon: BarChart3 },
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

  const visibleMainItems = useMemo(() => mainItems.filter((item) => hasPermission(item.module)), [hasPermission]);
  const visibleCoordinatorItems = useMemo(() => coordinatorItems.filter((item) => hasPermission(item.module)), [hasPermission]);

  return (
    <Sidebar ref={ref} collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <img src={logoRadar} alt="Radar Eleitoral" className="h-8 w-8 shrink-0 rounded" />
          {!collapsed && <span className="font-bold text-lg text-foreground tracking-tight">RADAR ELEITORAL</span>}
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 pb-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{isAdminGabinete ? "Administrador" : isSuperAdmin ? "Super Admin" : "Operador"}</p>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-accent transition-colors" activeClassName="bg-primary/10 text-primary font-semibold">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Coordinator Menu */}
        {visibleCoordinatorItems.length > 0 && (
          <SidebarGroup>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors group">
                  Gestão e Logística
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleCoordinatorItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)}>
                          <NavLink to={item.url} end className="hover:bg-accent transition-colors" activeClassName="bg-primary/10 text-primary font-semibold">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Admin Menu - Super Admin only */}
        {isSuperAdmin && (
          <SidebarGroup>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors group">
                  Painel Master
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)}>
                          <NavLink to={item.url} end className="hover:bg-accent transition-colors" activeClassName="bg-primary/10 text-primary font-semibold">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Config */}
        {(isSuperAdmin || isAdminGabinete) && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {configItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end className="hover:bg-accent transition-colors" activeClassName="bg-primary/10 text-primary font-semibold">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sair do Sistema"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}));