import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Get user's tenant with plan info
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tenant with plan
    const { data: tenant } = await supabaseClient
      .from("tenants")
      .select("plan_id, contact_limit, plans(name, contact_limit, user_limit, duration_days, has_premium_modules)")
      .eq("id", profile.tenant_id)
      .single();

    // Check active subscription in local DB
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      await supabaseClient
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", subscription.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get limits from plan (DB) or fallback
    const plan = tenant?.plans as any;
    const contactLimit = plan?.contact_limit ?? tenant?.contact_limit ?? 5000;
    const userLimit = plan?.user_limit ?? 5;
    const durationDays = plan?.duration_days ?? 30;
    const hasPremiumModules = plan?.has_premium_modules ?? false;

    return new Response(JSON.stringify({
      subscribed: true,
      plan_name: subscription.plan_name,
      subscription_end: subscription.expires_at,
      subscription_id: subscription.id,
      contact_limit: contactLimit,
      user_limit: userLimit,
      duration_days: durationDays,
      has_premium_modules: hasPremiumModules,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CHECK-SUBSCRIPTION] ERROR:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
