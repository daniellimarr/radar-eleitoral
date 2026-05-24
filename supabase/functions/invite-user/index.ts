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

    // Verify caller is authenticated using getClaims (works with ES256)
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

    // Use getClaims instead of getUser for ES256 token compatibility
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("Claims error:", claimsError);
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check caller is admin using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const roles = callerRoles?.map((r: any) => r.role) || [];
    if (!roles.includes("super_admin") && !roles.includes("admin_gabinete")) {
      throw new Error("Sem permissão");
    }

    // Get caller tenant
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", callerId)
      .single();
    if (!callerProfile?.tenant_id) throw new Error("Tenant não encontrado");

    const { email, full_name, password, role, modules } = await req.json();
    if (!email || !password || !full_name) throw new Error("Dados incompletos");

    // Validate role against allowed values and enforce role ceiling
    // admin_gabinete can only assign operador, assessor, coordenador (NOT admin_gabinete or super_admin)
    const ROLE_HIERARCHY = ['operador', 'assessor', 'coordenador', 'admin_gabinete', 'super_admin'];
    const callerMaxIdx = roles.includes('super_admin') ? 4 : 2; // admin_gabinete max = coordenador (index 2)
    const assignedIdx = ROLE_HIERARCHY.indexOf(role || 'operador');
    if (assignedIdx < 0 || assignedIdx > callerMaxIdx) {
      throw new Error('Não é possível atribuir esse perfil de acesso');
    }

    // Create user via admin API — handle "email already exists"
    let userId: string;
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      // If user already exists, look up by email and reuse
      const errMsg = createError.message || "";
      const errCode = (createError as any).code || "";
      if (errMsg.includes("already") || errCode === "email_exists") {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users?.find((u: any) => u.email === email);
        if (!existing) throw new Error("Usuário existe mas não foi encontrado");
        userId = existing.id;
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;
    }

    // Set profile tenant
    await adminClient
      .from("profiles")
      .update({ tenant_id: callerProfile.tenant_id, full_name, status: "approved" })
      .eq("user_id", userId);

    // Set role
    if (role) {
      await adminClient.from("user_roles").insert({
        user_id: userId,
        role,
        tenant_id: callerProfile.tenant_id,
      });
    }

    // Set module permissions
    if (modules && Array.isArray(modules) && modules.length > 0) {
      const permRows = modules.map((m: string) => ({
        user_id: userId,
        tenant_id: callerProfile.tenant_id,
        module: m,
      }));
      await adminClient.from("user_permissions").insert(permRows);
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("invite-user error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
