import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!;
const ASAAS_BASE_URL = ASAAS_API_KEY?.startsWith("$aact_")
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/v3";

const PLANS: Record<string, { name: string; value: number; cycle: string }> = {
  mensal: { name: "Mensal", value: 97, cycle: "MONTHLY" },
  trimestral: { name: "Trimestral", value: 247, cycle: "QUARTERLY" },
  anual: { name: "Anual", value: 697, cycle: "YEARLY" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;
    const { plan_key } = await req.json();

    const plan = PLANS[plan_key];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Get profile with asaas_customer_id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("asaas_customer_id, tenant_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.asaas_customer_id) {
      return new Response(JSON.stringify({ error: "Asaas customer not found. Please create customer first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate next due date (tomorrow)
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split("T")[0];

    // Create subscription in Asaas
    const asaasRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: profile.asaas_customer_id,
        billingType: "UNDEFINED", // Allows PIX, boleto, credit card
        value: plan.value,
        nextDueDate: dueDateStr,
        cycle: plan.cycle,
        description: `Radar Eleitoral - Plano ${plan.name}`,
        externalReference: userId,
      }),
    });

    const asaasData = await asaasRes.json();
    console.log("[ASAAS-CREATE-SUBSCRIPTION] Response:", JSON.stringify(asaasData));

    if (!asaasRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to create subscription", details: asaasData }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deactivate old subscriptions
    if (profile.tenant_id) {
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "replaced" })
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "active");
    }

    // Save subscription to database
    await supabaseAdmin.from("subscriptions").insert({
      tenant_id: profile.tenant_id,
      user_id: userId,
      plan_name: plan.name,
      status: "pending",
      asaas_subscription_id: asaasData.id,
      asaas_customer_id: profile.asaas_customer_id,
      next_due_date: dueDateStr,
    });

    // Get the payment link for the first invoice
    const invoiceUrl = asaasData.paymentLink || `https://www.asaas.com/c/${asaasData.id}`;

    return new Response(JSON.stringify({
      subscription_id: asaasData.id,
      payment_url: invoiceUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ASAAS-CREATE-SUBSCRIPTION] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
