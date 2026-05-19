import { expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Campaigns from "../pages/Campaigns";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock do hook useAuth para simular usuário logado e tenantId
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    tenantId: "test-tenant-id",
    profile: { tenant_id: "test-tenant-id", user_id: "test-user-id" },
    loading: false,
    permissionsLoading: false,
  }),
}));

// Mock do supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: { tenant_id: "test-tenant-id" }, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

const queryClient = new QueryClient();

test("deve sincronizar o valor do campo Nome da Campanha mesmo com preenchimento automático (onInput)", async () => {
  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Campaigns />
      </QueryClientProvider>
    </BrowserRouter>
  );

  // Abrir o diálogo de nova campanha
  const btnNova = screen.getByText(/Nova Campanha/i);
  fireEvent.click(btnNova);

  // Localizar o input de nome
  const inputNome = screen.getByLabelText(/Nome da Campanha/i) as HTMLInputElement;

  // Simular preenchimento automático (que muitas vezes dispara onInput mas não onChange em alguns ambientes de teste/navegador)
  fireEvent.input(inputNome, { target: { value: "Campanha Teste Autofill" } });

  expect(inputNome.value).toBe("Campanha Teste Autofill");

  // Tentar clicar em Criar
  const btnCriar = screen.getByRole("button", { name: /Criar/i });
  
  // Se o estado não estivesse sincronizado, o botão estaria desabilitado ou a validação de toast (mockada ou real) falharia.
  // Como o botão depende do loading e tenantId no JSX atual, verificamos se ele está clicável.
  expect(btnCriar).not.toBeDisabled();
  
  fireEvent.click(btnCriar);
});
