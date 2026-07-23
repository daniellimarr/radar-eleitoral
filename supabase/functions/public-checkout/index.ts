import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!;
const ASAAS_ENV = Deno.env.get("ASAAS_ENV") || "sandbox";
const ASAAS_BASE_URL =
  ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

const PLANS: Record<string, { name: string; value: number; cycle: string }> = {
  mensal: { name: "Mensal", value: 97, cycle: "MONTHLY" },
  trimestral: { name: "Trimestral", value: 247, cycle: "QUARTERLY" },
  anual: { name: "Anual", value: 697, cycle: "YEARLY" },
};

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { plan_key, name, email, cpf, phone } = await req.json();

    if (!plan_key || !PLANS[plan_key]) {
      return json({ error: "Plano inválido" }, 400);
    }
    if (!name || String(name).trim().length < 3) {
      return json({ error: "Informe seu nome completo" }, 400);
    }
    if (!email || !isValidEmail(String(email))) {
      return json({ error: "E-mail inválido" }, 400);
    }
    const cpfDigits = String(cpf || "").replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      return json({ error: "CPF deve ter 11 dígitos" }, 400);
    }
    const phoneDigits = phone ? String(phone).replace(/\D/g, "") : "";

    const plan = PLANS[plan_key];
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Anti-duplicate: same CPF+plan_key with pending in last 24h → reuse
    const { data: recent } = await admin
      .from("pending_signups")
      .select("asaas_subscription_id")
      .eq("cpf", cpfDigits)
      .eq("plan_key", plan_key)
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.asaas_subscription_id) {
      const url = await fetchInvoiceUrl(recent.asaas_subscription_id);
      if (url) return json({ payment_url: url, reused: true });
    }

    // 1) Create/reuse Asaas customer
    let customerId: string | null = null;
    const searchRes = await fetch(
      `${ASAAS_BASE_URL}/customers?cpfCnpj=${cpfDigits}`,
      { headers: { access_token: ASAAS_API_KEY } },
    );
    const searchData = await searchRes.json();
    if (searchData?.data?.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
        body: JSON.stringify({
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          cpfCnpj: cpfDigits,
          mobilePhone: phoneDigits || undefined,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        console.error("[PUBLIC-CHECKOUT] Asaas customer error:", createData);
        return json({ error: "Erro ao criar cliente no gateway", details: createData }, 400);
      }
      customerId = createData.id;
    }

    // 2) Create subscription
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1);
    const dueDateStr = nextDue.toISOString().split("T")[0];

    const subRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: plan.value,
        nextDueDate: dueDateStr,
        cycle: plan.cycle,
        description: `Radar Eleitoral - Plano ${plan.name}`,
      }),
    });
    const subData = await subRes.json();
    if (!subRes.ok) {
      console.error("[PUBLIC-CHECKOUT] Asaas subscription error:", subData);
      return json({ error: "Erro ao criar assinatura", details: subData }, 400);
    }

    const asaasSubId = subData.id;

    // 3) Persist pending signup for webhook to consume
    await admin.from("pending_signups").upsert({
      asaas_subscription_id: asaasSubId,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      cpf: cpfDigits,
      phone: phoneDigits || null,
      plan_key,
      asaas_customer_id: customerId,
    });

    // 4) Insert subscription placeholder (no tenant/user yet)
    await admin.from("subscriptions").insert({
      plan_name: plan.name,
      status: "pending",
      asaas_subscription_id: asaasSubId,
      asaas_customer_id: customerId,
      next_due_date: dueDateStr,
    });

    // 5) Fetch payment link
    const invoiceUrl = await fetchInvoiceUrl(asaasSubId);
    const fallback = ASAAS_BASE_URL.includes("sandbox")
      ? `https://sandbox.asaas.com/c/${asaasSubId}`
      : `https://www.asaas.com/c/${asaasSubId}`;

    return json({
      subscription_id: asaasSubId,
      payment_url: invoiceUrl || fallback,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PUBLIC-CHECKOUT] ERROR:", msg);
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchInvoiceUrl(subId: string): Promise<string> {
  try {
    const res = await fetch(`${ASAAS_BASE_URL}/payments?subscription=${subId}`, {
      headers: { access_token: ASAAS_API_KEY },
    });
    const data = await res.json();
    if (data?.data?.length > 0) {
      const p = data.data[0];
      return p.invoiceUrl || p.bankSlipUrl || "";
    }
  } catch (e) {
    console.error("[PUBLIC-CHECKOUT] invoice fetch:", e);
  }
  return "";
}
