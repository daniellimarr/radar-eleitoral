import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check caller is super_admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const roles = callerRoles?.map((r: any) => r.role) || [];
    if (!roles.includes("super_admin")) {
      throw new Error("Apenas super_admin pode criar tenants com onboarding");
    }

    const {
      tenant_name,
      tenant_document,
      plan_id,
      contact_limit,
      admin_email,
      admin_name,
      admin_password,
    } = await req.json();

    if (!tenant_name?.trim()) throw new Error("Nome do tenant é obrigatório");
    if (!admin_email || !admin_password || !admin_name) {
      throw new Error("Dados do administrador são obrigatórios (email, nome, senha)");
    }

    // Step 1: Create tenant
    const { data: newTenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({
        name: tenant_name.trim(),
        document: tenant_document?.trim() || null,
        plan_id: plan_id || null,
        contact_limit: parseInt(contact_limit) || 1000,
        status: "ativo",
      })
      .select("id")
      .single();

    if (tenantError) {
      throw new Error("Erro ao criar tenant: " + tenantError.message);
    }

    const tenantId = newTenant.id;

    // Step 2: Create admin user
    let userId: string;
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_name },
    });

    if (createError) {
      const errMsg = createError.message || "";
      const errCode = (createError as any).code || "";
      if (errMsg.includes("already") || errCode === "email_exists") {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users?.find((u: any) => u.email === admin_email);
        if (!existing) {
          // Rollback tenant
          await adminClient.from("tenants").delete().eq("id", tenantId);
          throw new Error("Usuário existe mas não foi encontrado");
        }
        userId = existing.id;
      } else {
        // Rollback tenant
        await adminClient.from("tenants").delete().eq("id", tenantId);
        throw createError;
      }
    } else {
      userId = newUser.user.id;
    }

    // Step 3: Link profile to tenant
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        tenant_id: tenantId,
        full_name: admin_name,
        status: "approved",
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Profile might not exist yet (trigger may be delayed), try insert
      await adminClient.from("profiles").insert({
        user_id: userId,
        tenant_id: tenantId,
        full_name: admin_name,
        status: "approved",
      });
    }

    // Step 4: Assign admin_gabinete role
    await adminClient.from("user_roles").upsert(
      {
        user_id: userId,
        role: "admin_gabinete",
        tenant_id: tenantId,
      },
      { onConflict: "user_id,role" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenantId,
        user_id: userId,
        message: `Tenant "${tenant_name}" criado com admin ${admin_email}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("onboard-tenant error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
