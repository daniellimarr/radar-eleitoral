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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("[ASAAS-CREATE-CUSTOMER] Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    const { name, email, cpf, phone } = await req.json();

    console.log("[ASAAS-CREATE-CUSTOMER] User:", userId);

    // Get or create profile
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("asaas_customer_id, tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    // If no profile exists, create one with a new tenant
    if (!profile) {
      console.log("[ASAAS-CREATE-CUSTOMER] No profile found, creating one...");
      const userName = name || email || userEmail;

      // Create tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .insert({ name: userName, status: "ativo", contact_limit: 5000 })
        .select("id")
        .single();

      if (tenantError) {
        console.error("[ASAAS-CREATE-CUSTOMER] Tenant creation error:", tenantError.message);
        return new Response(JSON.stringify({ error: "Failed to create tenant" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({ user_id: userId, full_name: userName, status: "approved", tenant_id: tenant.id });

      if (profileError) {
        console.error("[ASAAS-CREATE-CUSTOMER] Profile creation error:", profileError.message);
        return new Response(JSON.stringify({ error: "Failed to create profile" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Create role
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin_gabinete", tenant_id: tenant.id });

      profile = { asaas_customer_id: null, tenant_id: tenant.id };
    }

    // If customer already exists in Asaas, update CPF if provided
    if (profile.asaas_customer_id) {
      if (cpf) {
        console.log("[ASAAS-CREATE-CUSTOMER] Updating customer CPF:", profile.asaas_customer_id);
        const updateRes = await fetch(`${ASAAS_BASE_URL}/customers/${profile.asaas_customer_id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": ASAAS_API_KEY,
          },
          body: JSON.stringify({ cpfCnpj: cpf }),
        });
        const updateData = await updateRes.json();
        console.log("[ASAAS-CREATE-CUSTOMER] Update response:", JSON.stringify(updateData));
      }
      return new Response(JSON.stringify({ customer_id: profile.asaas_customer_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create customer in Asaas
    const asaasRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name: name || email || userEmail,
        email: email || userEmail,
        cpfCnpj: cpf || undefined,
        mobilePhone: phone || undefined,
        externalReference: userId,
      }),
    });

    const asaasData = await asaasRes.json();
    console.log("[ASAAS-CREATE-CUSTOMER] Response:", JSON.stringify(asaasData));

    if (!asaasRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to create Asaas customer", details: asaasData }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save customer ID to profile
    await supabaseAdmin
      .from("profiles")
      .update({ asaas_customer_id: asaasData.id })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ customer_id: asaasData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ASAAS-CREATE-CUSTOMER] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
