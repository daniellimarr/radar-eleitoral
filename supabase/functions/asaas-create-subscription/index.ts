import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!;
const ASAAS_ENV = Deno.env.get("ASAAS_ENV") || "sandbox";
const ASAAS_BASE_URL = ASAAS_ENV === "production"
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3";

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
    console.log("[ASAAS-CREATE-SUBSCRIPTION] Request received");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("[ASAAS-CREATE-SUBSCRIPTION] Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = userData.user.id;
    console.log("[ASAAS-CREATE-SUBSCRIPTION] User:", userId);
    
    let body;
    try {
      body = await req.json();
      console.log("[ASAAS-CREATE-SUBSCRIPTION] Body:", JSON.stringify(body));
    } catch (e) {
      console.error("[ASAAS-CREATE-SUBSCRIPTION] Failed to parse body:", e);
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { plan_key } = body;

    const plan = PLANS[plan_key];
    if (!plan) {
      console.error("[ASAAS-CREATE-SUBSCRIPTION] Invalid plan_key:", plan_key);
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[ASAAS-CREATE-SUBSCRIPTION] Plan:", plan_key, plan.name);

    // Get profile with asaas_customer_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("asaas_customer_id, tenant_id")
      .eq("user_id", userId)
      .single();

    console.log("[ASAAS-CREATE-SUBSCRIPTION] Profile:", JSON.stringify(profile), "Error:", profileError?.message);

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

    console.log("[ASAAS-CREATE-SUBSCRIPTION] Creating subscription for customer:", profile.asaas_customer_id);

    // Create subscription in Asaas
    const asaasRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: profile.asaas_customer_id,
        billingType: "UNDEFINED",
        value: plan.value,
        nextDueDate: dueDateStr,
        cycle: plan.cycle,
        description: `Radar Eleitoral - Plano ${plan.name}`,
        externalReference: userId,
      }),
    });

    const asaasData = await asaasRes.json();
    console.log("[ASAAS-CREATE-SUBSCRIPTION] Asaas response status:", asaasRes.status);
    console.log("[ASAAS-CREATE-SUBSCRIPTION] Asaas response:", JSON.stringify(asaasData));

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
    const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({
      tenant_id: profile.tenant_id,
      user_id: userId,
      plan_name: plan.name,
      status: "pending",
      asaas_subscription_id: asaasData.id,
      asaas_customer_id: profile.asaas_customer_id,
      next_due_date: dueDateStr,
    });
    
    console.log("[ASAAS-CREATE-SUBSCRIPTION] Insert result error:", insertError?.message);

    // Get payment link - try to get the invoiceUrl from the first payment
    let invoiceUrl = "";
    
    // Fetch payments for this subscription (try immediately, Asaas usually creates it synchronously)
    try {
      const paymentsRes = await fetch(`${ASAAS_BASE_URL}/payments?subscription=${asaasData.id}`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      const paymentsData = await paymentsRes.json();
      console.log("[ASAAS-CREATE-SUBSCRIPTION] Payments:", JSON.stringify(paymentsData));
      
      if (paymentsData?.data?.length > 0) {
        const firstPayment = paymentsData.data[0];
        invoiceUrl = firstPayment.invoiceUrl || firstPayment.bankSlipUrl || "";
      }
    } catch (e) {
      console.error("[ASAAS-CREATE-SUBSCRIPTION] Error fetching payments:", e);
    }

    if (!invoiceUrl) {
      // Fallback: construct payment URL
      const baseUrl = ASAAS_BASE_URL.includes("sandbox") ? "https://sandbox.asaas.com" : "https://www.asaas.com";
      invoiceUrl = `${baseUrl}/c/${asaasData.id}`;
    }
    
    console.log("[ASAAS-CREATE-SUBSCRIPTION] Final invoiceUrl:", invoiceUrl);

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
