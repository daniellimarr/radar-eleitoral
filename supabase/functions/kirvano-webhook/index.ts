import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_MAP: Record<string, string> = {
  "bronze": "Bronze",
  "prata": "Prata",
  "ouro": "Ouro",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    console.log("[KIRVANO-WEBHOOK] Received:", JSON.stringify(body));

    const event = body.event || body.type;
    const email = body.customer?.email || body.email;
    const planKey = (body.product?.name || body.plan || "").toLowerCase();
    const transactionId = body.transaction_id || body.id;
    const subscriptionId = body.subscription_id || body.subscription?.id;

    if (!email) {
      console.log("[KIRVANO-WEBHOOK] No email found in payload");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    const { data: userData } = await supabaseClient.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email === email);

    if (!user) {
      console.log("[KIRVANO-WEBHOOK] User not found for email:", email);
      return new Response(JSON.stringify({ received: true, warning: "user_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tenant
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      console.log("[KIRVANO-WEBHOOK] No tenant for user:", user.id);
      return new Response(JSON.stringify({ received: true, warning: "no_tenant" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve plan name
    let planName = "Bronze";
    for (const [key, name] of Object.entries(PLAN_MAP)) {
      if (planKey.includes(key)) {
        planName = name;
        break;
      }
    }

    // Handle events
    if (event === "sale_approved" || event === "approved" || event === "purchase_approved" || event === "subscription_created") {
      // Deactivate old subscriptions
      await supabaseClient
        .from("subscriptions")
        .update({ status: "replaced" })
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "active");

      // Determine expiration based on plan
      const expiresAt = new Date();
      if (planKey.includes("anual") || planKey.includes("ouro")) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (planKey.includes("trimestral") || planKey.includes("prata")) {
        expiresAt.setDate(expiresAt.getDate() + 90);
      } else {
        expiresAt.setDate(expiresAt.getDate() + 30);
      }

      await supabaseClient.from("subscriptions").insert({
        tenant_id: profile.tenant_id,
        user_id: user.id,
        plan_name: planName,
        status: "active",
        kirvano_transaction_id: transactionId,
        kirvano_subscription_id: subscriptionId,
        expires_at: expiresAt.toISOString(),
      });

      // Activate tenant (gabinete)
      await supabaseClient
        .from("tenants")
        .update({ status: "ativo" })
        .eq("id", profile.tenant_id);

      console.log("[KIRVANO-WEBHOOK] Subscription activated:", planName, "for tenant:", profile.tenant_id, "expires:", expiresAt.toISOString());

    } else if (event === "subscription_cancelled" || event === "cancelled" || event === "refunded") {
      await supabaseClient
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "active");

      // Suspend tenant (gabinete)
      await supabaseClient
        .from("tenants")
        .update({ status: "suspenso" })
        .eq("id", profile.tenant_id);

      console.log("[KIRVANO-WEBHOOK] Subscription cancelled, tenant suspended:", profile.tenant_id);

    } else if (event === "subscription_renewed" || event === "renewed") {
      // Extend based on plan
      const expiresAt = new Date();
      if (planKey.includes("anual") || planKey.includes("ouro")) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else if (planKey.includes("trimestral") || planKey.includes("prata")) {
        expiresAt.setDate(expiresAt.getDate() + 90);
      } else {
        expiresAt.setDate(expiresAt.getDate() + 30);
      }

      await supabaseClient
        .from("subscriptions")
        .update({ expires_at: expiresAt.toISOString() })
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "active");

      // Ensure tenant is active on renewal
      await supabaseClient
        .from("tenants")
        .update({ status: "ativo" })
        .eq("id", profile.tenant_id);

      console.log("[KIRVANO-WEBHOOK] Subscription renewed for tenant:", profile.tenant_id, "expires:", expiresAt.toISOString());
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[KIRVANO-WEBHOOK] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
