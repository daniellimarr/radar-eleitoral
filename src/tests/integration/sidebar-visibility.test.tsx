import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock sidebar context/hook if needed
// vi.mock("@/components/ui/sidebar", async () => {
//   const actual = await vi.importActual("@/components/ui/sidebar");
//   return { ...actual };
// });

describe("Visibilidade da Barra Lateral (Sidebar) - Integração", () => {
  const mockUseAuth = useAuth as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSidebar = () => {
    return render(
      <SidebarProvider>
        <MemoryRouter>
          <AppSidebar />
        </MemoryRouter>
      </SidebarProvider>
    );
  };

  describe("Perfil: super_admin", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: { full_name: "Super Admin User" },
        hasRole: (role: string) => role === "super_admin",
        hasPermission: () => true,
        signOut: vi.fn(),
      });
    });

    it("deve mostrar todos os menus, incluindo Painel Master e Sistema", () => {
      renderSidebar();
      
      expect(screen.getByText("RADAR ELEITORAL")).toBeInTheDocument();
      expect(screen.getByText("Painel Master")).toBeInTheDocument();
      expect(screen.getByText("Gestão de Gabinetes")).toBeInTheDocument();
      expect(screen.getByText("Sistema")).toBeInTheDocument();
      expect(screen.getByText("Backup")).toBeInTheDocument();
    });
  });

  describe("Perfil: admin_gabinete", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        profile: { full_name: "Admin Gabinete User" },
        hasRole: (role: string) => role === "admin_gabinete",
        hasPermission: () => true,
        signOut: vi.fn(),
      });
    });

    it("deve mostrar menus de Sistema (Backup), mas NÃO o Painel Master", () => {
      renderSidebar();
      
      expect(screen.getByText("Sistema")).toBeInTheDocument();
      expect(screen.getByText("Backup")).toBeInTheDocument();
      expect(screen.queryByText("Painel Master")).not.toBeInTheDocument();
      expect(screen.queryByText("Gestão de Gabinetes")).not.toBeInTheDocument();
    });
  });

  describe("Perfil: user (Operador)", () => {
    it("deve mostrar apenas módulos que possui permissão e ocultar Sistema/Painel Master", () => {
      mockUseAuth.mockReturnValue({
        profile: { full_name: "Operador User" },
        hasRole: (role: string) => role === "operador",
        hasPermission: (module: string) => module === "contacts" || module === "dashboard",
        signOut: vi.fn(),
      });

      renderSidebar();
      
      expect(screen.getByText("Início")).toBeInTheDocument();
      expect(screen.getByText("Contatos")).toBeInTheDocument();
      
      // Módulos sem permissão
      expect(screen.queryByText("Campanhas")).not.toBeInTheDocument();
      expect(screen.queryByText("Demandas")).not.toBeInTheDocument();
      
      // Menus restritos
      expect(screen.queryByText("Sistema")).not.toBeInTheDocument();
      expect(screen.queryByText("Painel Master")).not.toBeInTheDocument();
    });
  });
});
