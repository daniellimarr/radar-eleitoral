import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "./index.ts";

Deno.test("validate-cpf rejects requests without Authorization header", async () => {
  const req = new Request("http://localhost/validate-cpf", {
    method: "POST",
    body: JSON.stringify({ cpf: "12345678909" }),
  });
  
  const res = await handler(req);
  
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
  assertEquals(data.message, "Unauthorized");
});

Deno.test("validate-cpf rejects requests with invalid Authorization format", async () => {
  const req = new Request("http://localhost/validate-cpf", {
    method: "POST",
    headers: {
      "Authorization": "InvalidToken"
    },
    body: JSON.stringify({ cpf: "12345678909" }),
  });
  
  const res = await handler(req);
  
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
  assertEquals(data.message, "Unauthorized");
});

Deno.test("validate-cpf rejects requests with invalid JWT token", async () => {
  // Mocking environment variables that are needed
  Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "example-key");

  const req = new Request("http://localhost/validate-cpf", {
    method: "POST",
    headers: {
      "Authorization": "Bearer invalid.jwt.token"
    },
    body: JSON.stringify({ cpf: "12345678909" }),
  });
  
  const res = await handler(req);
  
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
  assertEquals(data.message, "Unauthorized");
});
