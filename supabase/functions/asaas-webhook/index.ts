import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
  const accessToken = req.headers.get("asaas-access-token");
  if (asaasApiKey && accessToken !== asaasApiKey) {
    console.error("[ASAAS-WEBHOOK] Invalid or missing access token");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    console.log("[ASAAS-WEBHOOK] Received event:", body.event);

    const event = body.event;
    const payment = body.payment;
    const subscription = body.subscription;

    if (!event) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const getSubIdFromPayment = () => {
      return payment?.subscription || subscription?.id || null;
    };

    const asaasSubId = getSubIdFromPayment();

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        if (!asaasSubId) {
          console.log("[ASAAS-WEBHOOK] No subscription ID in payment event");
          break;
        }

        // Get subscription with tenant info
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("plan_name, tenant_id")
          .eq("asaas_subscription_id", asaasSubId)
          .single();

        // Calculate expires_at using duration_days from plans table
        let expiresAt: string | null = null;
        if (existingSub?.tenant_id) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("plan_id, plans(duration_days)")
            .eq("id", existingSub.tenant_id)
            .single();

          const plan = tenant?.plans as any;
          let durationDays = plan?.duration_days;

          // Fallback to plan name if no plan linked
          if (!durationDays && existingSub?.plan_name) {
            const planLower = existingSub.plan_name.toLowerCase();
            if (planLower.includes("anual")) durationDays = 365;
            else if (planLower.includes("trimestral")) durationDays = 90;
            else durationDays = 30;
          }

          if (durationDays) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + durationDays);
            expiresAt = expDate.toISOString();
          }
        }

        const { data: subData } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            next_due_date: payment?.dueDate || null,
            expires_at: expiresAt,
          })
          .eq("asaas_subscription_id", asaasSubId)
          .select("tenant_id")
          .single();

        // Activate tenant
        if (subData?.tenant_id) {
          await supabase
            .from("tenants")
            .update({ status: "ativo" })
            .eq("id", subData.tenant_id);
        }

        // Record payment
        if (payment && subData?.tenant_id) {
          const { data: subRecord } = await supabase
            .from("subscriptions")
            .select("id, user_id")
            .eq("asaas_subscription_id", asaasSubId)
            .single();

          if (subRecord) {
            await supabase.from("payments").insert({
              tenant_id: subData.tenant_id,
              user_id: subRecord.user_id,
              subscription_id: subRecord.id,
              asaas_payment_id: payment.id,
              amount: payment.value || 0,
              status: "confirmed",
              payment_date: new Date().toISOString(),
              due_date: payment.dueDate,
              billing_type: payment.billingType,
            });
          }
        }

        console.log("[ASAAS-WEBHOOK] Payment confirmed for subscription:", asaasSubId);
        break;
      }

      case "PAYMENT_OVERDUE": {
        if (!asaasSubId) break;

        const { data: subData } = await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("asaas_subscription_id", asaasSubId)
          .select("tenant_id")
          .single();

        if (subData?.tenant_id) {
          await supabase
            .from("tenants")
            .update({ status: "suspenso" })
            .eq("id", subData.tenant_id);
        }

        console.log("[ASAAS-WEBHOOK] Payment overdue for subscription:", asaasSubId);
        break;
      }

      case "SUBSCRIPTION_CREATED": {
        const subId = subscription?.id || asaasSubId;
        if (subId) {
          console.log("[ASAAS-WEBHOOK] Subscription created:", subId);
        }
        break;
      }

      case "SUBSCRIPTION_CANCELED":
      case "SUBSCRIPTION_DELETED": {
        const subId = subscription?.id || asaasSubId;
        if (!subId) break;

        const { data: subData } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("asaas_subscription_id", subId)
          .select("tenant_id")
          .single();

        if (subData?.tenant_id) {
          await supabase
            .from("tenants")
            .update({ status: "suspenso" })
            .eq("id", subData.tenant_id);
        }

        console.log("[ASAAS-WEBHOOK] Subscription cancelled:", subId);
        break;
      }

      default:
        console.log("[ASAAS-WEBHOOK] Unhandled event:", event);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ASAAS-WEBHOOK] ERROR:", msg);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
