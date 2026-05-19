import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock AppLayout to simplify tests
vi.mock("@/components/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("Acesso Baseado em Funções (RBAC) - Integração", () => {
  const mockUseAuth = useAuth as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Perfil: super_admin", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "1" },
        loading: false,
        permissionsLoading: false,
        hasRole: (role: string) => role === "super_admin",
        hasPermission: () => true, // super_admin has all permissions
      });
    });

    it("deve permitir acesso à rota de administração master", () => {
      render(
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute role="super_admin"><div>Admin Dashboard</div></ProtectedRoute>} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    it("deve permitir acesso a qualquer módulo", () => {
      render(
        <MemoryRouter initialEntries={["/contacts"]}>
          <Routes>
            <Route path="/contacts" element={<ProtectedRoute module="contacts"><div>Contatos</div></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Contatos")).toBeInTheDocument();
    });
  });

  describe("Perfil: admin_gabinete", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "2" },
        loading: false,
        permissionsLoading: false,
        hasRole: (role: string) => role === "admin_gabinete",
        hasPermission: (module: string) => true, // admin_gabinete has all permissions in their cabinet
      });
    });

    it("deve permitir acesso ao backup", () => {
      render(
        <MemoryRouter initialEntries={["/backup"]}>
          <Routes>
            <Route path="/backup" element={<ProtectedRoute role={["super_admin", "admin_gabinete"]}><div>Backup</div></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Backup")).toBeInTheDocument();
    });

    it("NÃO deve permitir acesso à administração master", () => {
      render(
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute role="super_admin"><div>Admin Dashboard</div></ProtectedRoute>} />
            <Route path="/dashboard" element={<div>Redirecionado para Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Redirecionado para Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
    });
  });

  describe("Perfil: user (Operador)", () => {
    it("deve permitir acesso a um módulo se tiver permissão", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "3" },
        loading: false,
        permissionsLoading: false,
        hasRole: (role: string) => role === "operador",
        hasPermission: (module: string) => module === "contacts",
      });

      render(
        <MemoryRouter initialEntries={["/contacts"]}>
          <Routes>
            <Route path="/contacts" element={<ProtectedRoute module="contacts"><div>Contatos</div></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Contatos")).toBeInTheDocument();
    });

    it("NÃO deve permitir acesso a um módulo se NÃO tiver permissão", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "3" },
        loading: false,
        permissionsLoading: false,
        hasRole: (role: string) => role === "operador",
        hasPermission: (module: string) => module !== "demands", // No permission for demands
      });

      render(
        <MemoryRouter initialEntries={["/demands"]}>
          <Routes>
            <Route path="/demands" element={<ProtectedRoute module="demands"><div>Demandas</div></ProtectedRoute>} />
            <Route path="/dashboard" element={<div>Redirecionado para Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Redirecionado para Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Demandas")).not.toBeInTheDocument();
    });

    it("NÃO deve permitir acesso ao backup ou administração", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "3" },
        loading: false,
        permissionsLoading: false,
        hasRole: (role: string) => role === "operador",
        hasPermission: () => false,
      });

      render(
        <MemoryRouter initialEntries={["/backup"]}>
          <Routes>
            <Route path="/backup" element={<ProtectedRoute role={["super_admin", "admin_gabinete"]}><div>Backup</div></ProtectedRoute>} />
            <Route path="/dashboard" element={<div>Redirecionado para Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Redirecionado para Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Backup")).not.toBeInTheDocument();
    });
  });
});
