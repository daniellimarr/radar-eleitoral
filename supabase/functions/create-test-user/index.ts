import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const tenantId = "2b2d1200-c7fc-4d7f-aa63-edd351a11c67";

    // Create user via Admin API
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: "operador@radareleitoral.com",
      password: "Operador@2025",
      email_confirm: true,
      user_metadata: { full_name: "Operador Teste" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Update profile
    await adminClient.from("profiles").update({
      tenant_id: tenantId,
      full_name: "Operador Teste",
      status: "approved",
    }).eq("user_id", userId);

    // Assign role
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role: "operador",
      tenant_id: tenantId,
    });

    // Add permissions
    await adminClient.from("user_permissions").insert([
      { user_id: userId, module: "contacts", tenant_id: tenantId },
      { user_id: userId, module: "demands", tenant_id: tenantId },
      { user_id: userId, module: "appointments", tenant_id: tenantId },
    ]);

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
