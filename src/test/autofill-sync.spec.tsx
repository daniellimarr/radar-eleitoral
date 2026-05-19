import { expect, test } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Campaigns from "../pages/Campaigns";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    tenantId: "test-tenant-id",
    profile: { tenant_id: "test-tenant-id", user_id: "test-user-id" },
    loading: false,
    permissionsLoading: false,
  }),
}));

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
  await act(async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Campaigns />
        </QueryClientProvider>
      </BrowserRouter>
    );
  });

  const btnNova = screen.getByText(/Nova Campanha/i);
  await act(async () => {
    fireEvent.click(btnNova);
  });

  // Localizar o input pelo atributo name
  const container = document.body;
  const inputNome = container.querySelector('input[name="nome_campanha_radar"]') as HTMLInputElement;

  expect(inputNome).not.toBeNull();

  await act(async () => {
    fireEvent.input(inputNome, { target: { value: "Campanha Teste Autofill" } });
  });

  expect(inputNome.value).toBe("Campanha Teste Autofill");

  const btnCriar = screen.getByRole("button", { name: /Criar/i });
  expect(btnCriar).not.toBeDisabled();
  
  await act(async () => {
    fireEvent.click(btnCriar);
  });
});
