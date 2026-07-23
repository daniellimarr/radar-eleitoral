import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const PLAN_DURATION: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  anual: 365,
};

const PLAN_LIMITS: Record<string, { contact_limit: number; user_limit: number; name: string }> = {
  mensal: { contact_limit: 5000, user_limit: 5, name: "Mensal" },
  trimestral: { contact_limit: 10000, user_limit: 10, name: "Trimestral" },
  anual: { contact_limit: 20000, user_limit: 20, name: "Anual" },
};

function randomPassword(len = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
  if (!asaasApiKey) {
    return json({ error: "Server misconfiguration" }, 500);
  }
  const accessToken = req.headers.get("asaas-access-token");
  if (accessToken !== asaasApiKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json();
    console.log("[ASAAS-WEBHOOK] event:", body.event);

    const event = body.event;
    const payment = body.payment;
    const subscription = body.subscription;
    if (!event) return json({ received: true });

    const asaasSubId = payment?.subscription || subscription?.id || null;

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        if (!asaasSubId) break;

        // Load subscription record
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id, plan_name, tenant_id, user_id, status")
          .eq("asaas_subscription_id", asaasSubId)
          .maybeSingle();

        let tenantId = existingSub?.tenant_id as string | null;
        let userId = existingSub?.user_id as string | null;
        let planName = existingSub?.plan_name as string | null;
        let planKey: string | null = null;

        // AUTO-PROVISION path: no user/tenant yet → look up pending_signups
        if (!tenantId || !userId) {
          const { data: pending } = await supabase
            .from("pending_signups")
            .select("*")
            .eq("asaas_subscription_id", asaasSubId)
            .maybeSingle();

          if (pending) {
            planKey = pending.plan_key;
            const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.mensal;
            planName = planName || limits.name;

            // 1) Create or find auth user
            let newUserId: string | null = null;
            let tempPassword = randomPassword(16);
            const { data: created, error: createErr } = await supabase.auth.admin.createUser({
              email: pending.email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { full_name: pending.name, phone: pending.phone },
            });
            if (createErr) {
              const msg = createErr.message || "";
              if (msg.toLowerCase().includes("already") || (createErr as any).code === "email_exists") {
                const { data: list } = await supabase.auth.admin.listUsers();
                const existing = list?.users?.find((u: any) => u.email === pending.email);
                if (existing) newUserId = existing.id;
              } else {
                console.error("[ASAAS-WEBHOOK] createUser error:", msg);
              }
            } else {
              newUserId = created.user.id;
            }

            if (newUserId) {
              userId = newUserId;

              // 2) Create tenant
              const { data: newTenant, error: tenantErr } = await supabase
                .from("tenants")
                .insert({
                  name: pending.name,
                  status: "ativo",
                  contact_limit: limits.contact_limit,
                })
                .select("id")
                .single();

              if (tenantErr) {
                console.error("[ASAAS-WEBHOOK] tenant insert error:", tenantErr.message);
              } else {
                tenantId = newTenant.id;
              }

              // 3) Upsert profile
              if (tenantId) {
                const { error: profileErr } = await supabase.from("profiles").upsert(
                  {
                    user_id: userId,
                    full_name: pending.name,
                    email: pending.email,
                    status: "approved",
                    tenant_id: tenantId,
                    asaas_customer_id: pending.asaas_customer_id,
                  },
                  { onConflict: "user_id" },
                );
                if (profileErr) console.error("[ASAAS-WEBHOOK] profile err:", profileErr.message);

                // 4) Role
                await supabase.from("user_roles").upsert(
                  { user_id: userId, role: "admin_gabinete", tenant_id: tenantId },
                  { onConflict: "user_id,role" },
                );
              }

              // 5) Password recovery link (user defines their own password)
              try {
                const { data: linkData } = await supabase.auth.admin.generateLink({
                  type: "recovery",
                  email: pending.email,
                });
                console.log(
                  "[ASAAS-WEBHOOK] recovery link generated for",
                  pending.email,
                  linkData?.properties?.action_link ? "(sent)" : "(no link)",
                );
              } catch (e) {
                console.error("[ASAAS-WEBHOOK] generateLink error:", e);
              }
            }

            // Remove pending row (idempotent even if user creation failed — safer to keep? we delete only on full success)
            if (tenantId && userId) {
              await supabase.from("pending_signups").delete().eq("asaas_subscription_id", asaasSubId);
            }
          }
        }

        // Compute expires_at
        let expiresAt: string | null = null;
        let durationDays: number | null = null;

        if (planKey && PLAN_DURATION[planKey]) {
          durationDays = PLAN_DURATION[planKey];
        } else if (tenantId) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("plan_id, plans(duration_days)")
            .eq("id", tenantId)
            .maybeSingle();
          const p = tenant?.plans as any;
          durationDays = p?.duration_days || null;
        }
        if (!durationDays && planName) {
          const l = planName.toLowerCase();
          durationDays = l.includes("anual") ? 365 : l.includes("trimestral") ? 90 : 30;
        }
        if (durationDays) {
          const d = new Date();
          d.setDate(d.getDate() + durationDays);
          expiresAt = d.toISOString();
        }

        // Update subscription
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            tenant_id: tenantId,
            user_id: userId,
            plan_name: planName,
            next_due_date: payment?.dueDate || null,
            expires_at: expiresAt,
          })
          .eq("asaas_subscription_id", asaasSubId);

        // Ensure tenant active
        if (tenantId) {
          await supabase.from("tenants").update({ status: "ativo" }).eq("id", tenantId);
        }

        // Record payment
        if (payment && tenantId) {
          const { data: subRecord } = await supabase
            .from("subscriptions")
            .select("id, user_id")
            .eq("asaas_subscription_id", asaasSubId)
            .maybeSingle();

          if (subRecord) {
            await supabase.from("payments").insert({
              tenant_id: tenantId,
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

        console.log("[ASAAS-WEBHOOK] payment confirmed:", asaasSubId, "tenant:", tenantId, "user:", userId);
        break;
      }

      case "PAYMENT_OVERDUE": {
        if (!asaasSubId) break;
        const { data: subData } = await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("asaas_subscription_id", asaasSubId)
          .select("tenant_id")
          .maybeSingle();
        if (subData?.tenant_id) {
          await supabase.from("tenants").update({ status: "suspenso" }).eq("id", subData.tenant_id);
        }
        break;
      }

      case "SUBSCRIPTION_CANCELED":
      case "SUBSCRIPTION_DELETED": {
        const subId = subscription?.id || asaasSubId;
        if (!subId) break;
        const { data: subData } = await supabase
          .from("subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("asaas_subscription_id", subId)
          .select("tenant_id")
          .maybeSingle();
        if (subData?.tenant_id) {
          await supabase.from("tenants").update({ status: "suspenso" }).eq("id", subData.tenant_id);
        }
        break;
      }

      default:
        console.log("[ASAAS-WEBHOOK] unhandled:", event);
    }

    return json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ASAAS-WEBHOOK] ERROR:", msg);
    return json({ error: "Internal error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
