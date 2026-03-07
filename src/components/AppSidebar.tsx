import {
  Home, Users, FileText, Calendar, Car, Package, MapPin, Settings,
  BarChart3, ClipboardList, Link2, MessageSquare, LogOut, ChevronDown, Shield,
  Flag, Megaphone, Database, FolderDown
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
  { title: "Cadastro de Contato", url: "/contacts", icon: Users, module: "contacts" },
  { title: "Demandas", url: "/demands", icon: ClipboardList, module: "demands" },
  { title: "Agenda", url: "/appointments", icon: Calendar, module: "appointments" },
  { title: "Lideranças", url: "/leaders", icon: BarChart3, module: "leaders" },
  { title: "Marketing", url: "/marketing", icon: Megaphone, module: "marketing" },
  { title: "Arquivos da Campanha", url: "/campaign-files", icon: FolderDown, module: "campaign_files" },
  { title: "Mapa", url: "/map", icon: MapPin, module: "map" },
  { title: "Chat Interno", url: "/chat", icon: MessageSquare, module: "chat" },
];

const coordinatorItems = [
  { title: "Gestão de Usuários", url: "/admin/users", icon: Users, module: "user_management" },
  { title: "Veículos", url: "/vehicles", icon: Car, module: "vehicles" },
  { title: "Material de Campanha", url: "/materials", icon: Package, module: "materials" },
  { title: "Solicitações de Visita", url: "/visit-requests", icon: MessageSquare, module: "visit_requests" },
  { title: "Links de Cadastro", url: "/registration-links", icon: Link2, module: "registration_links" },
];

const adminItems = [
  { title: "Gestão de Gabinetes", url: "/admin/tenants", icon: Building2 },
  { title: "Gestão de Planos", url: "/admin/plans", icon: Package },
  { title: "Gestão de Usuários", url: "/admin/users", icon: Users },
  { title: "Relatórios e Auditoria", url: "/reports", icon: FileText },
];

const configItems = [
  { title: "Backup", url: "/backup", icon: Database },
  { title: "Configurações", url: "/settings", icon: Settings },
];

import React from "react";

export const AppSidebar = React.forwardRef<HTMLDivElement>(function AppSidebar(_props, ref) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, hasRole, hasPermission, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const isSuperAdmin = hasRole("super_admin");
  const isAdmin = hasRole("admin_gabinete") || isSuperAdmin;
  const isCoordinator = hasRole("coordenador") || isAdmin;

  const visibleMainItems = mainItems.filter((item) => hasPermission(item.module));
  const visibleCoordinatorItems = coordinatorItems.filter((item) => hasPermission(item.module));

  return (
    <Sidebar ref={ref} collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <img src={logoRadar} alt="Radar Eleitoral" className="h-8 w-8 shrink-0 rounded" />
          {!collapsed && <span className="font-bold text-lg text-foreground">RADAR ELEITORAL</span>}
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 pb-4 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">Online</p>
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
                    <NavLink to={item.url} end className="hover:bg-accent" activeClassName="bg-accent text-accent-foreground font-medium">
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
        {isCoordinator && visibleCoordinatorItems.length > 0 && (
          <SidebarGroup>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer">
                  Coordenador
                  <ChevronDown className="h-4 w-4" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleCoordinatorItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)}>
                          <NavLink to={item.url} end className="hover:bg-accent" activeClassName="bg-accent text-accent-foreground font-medium">
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
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer">
                  Administração
                  <ChevronDown className="h-4 w-4" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)}>
                          <NavLink to={item.url} end className="hover:bg-accent" activeClassName="bg-accent text-accent-foreground font-medium">
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-accent" activeClassName="bg-accent text-accent-foreground font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
});
