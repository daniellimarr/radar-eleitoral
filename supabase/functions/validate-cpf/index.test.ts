import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const FUNCTION_URL = "http://localhost:8000/validate-cpf";

Deno.test("validate-cpf rejects requests without Authorization header", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    body: JSON.stringify({ cpf: "12345678909" }),
  });
  
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
  assertEquals(data.message, "Unauthorized");
});

Deno.test("validate-cpf rejects requests with invalid Authorization format", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": "InvalidToken"
    },
    body: JSON.stringify({ cpf: "12345678909" }),
  });
  
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
  assertEquals(data.message, "Unauthorized");
});

Deno.test("validate-cpf rejects requests with invalid JWT token", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer invalid.jwt.token"
    },
    body: JSON.stringify({ cpf: "12345678909" }),
  });
  
  // The function calls supabase.auth.getClaims(token)
  // Even if it doesn't fail with an exception, it should return an error or empty sub
  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.valid, false);
  assertEquals(data.message, "Unauthorized");
});
