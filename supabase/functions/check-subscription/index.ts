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

    // Get user's profile to identify tenant
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

    // After removing Asaas, we default all active tenants to a "Subscribed" state 
    // using the limits defined in their linked plan or defaults.
    const { data: tenant } = await supabaseClient
      .from("tenants")
      .select("status, plan_id, contact_limit, plans(name, contact_limit, user_limit, duration_days, has_premium_modules)")
      .eq("id", profile.tenant_id)
      .single();

    const plan = tenant?.plans as any;
    const contactLimit = plan?.contact_limit ?? tenant?.contact_limit ?? 5000;
    const userLimit = plan?.user_limit ?? 5;
    const durationDays = plan?.duration_days ?? 30;
    const hasPremiumModules = plan?.has_premium_modules ?? true; // Default to true after removal of external gates

    return new Response(JSON.stringify({
      subscribed: tenant?.status === 'ativo',
      plan_name: plan?.name || "Plano Padrão",
      subscription_end: null, // No fixed end date after asaas removal
      contact_limit: contactLimit,
      user_limit: userLimit,
      duration_days: durationDays,
      has_premium_modules: hasPremiumModules,
      expired: tenant?.status === 'suspenso',
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