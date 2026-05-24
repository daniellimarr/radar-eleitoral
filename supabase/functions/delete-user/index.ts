import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin or coordenador
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller role
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const allowedRoles = ["super_admin", "admin_gabinete", "coordenador"];
    const callerRoleNames: string[] = (callerRoles || []).map((r: any) => r.role);
    const hasPermission = callerRoleNames.some((r) => allowedRoles.includes(r));
    if (!hasPermission) throw new Error("Sem permissão para excluir usuários");
    const isSuperAdmin = callerRoleNames.includes("super_admin");

    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id é obrigatório");

    // Prevent self-deletion
    if (user_id === caller.id) throw new Error("Não é possível excluir a si mesmo");

    // Tenant isolation: non-super_admin can only delete users in their own tenant
    if (!isSuperAdmin) {
      const { data: callerProfile } = await adminClient
        .from("profiles").select("tenant_id").eq("user_id", caller.id).maybeSingle();
      const { data: targetProfile } = await adminClient
        .from("profiles").select("tenant_id").eq("user_id", user_id).maybeSingle();
      if (!callerProfile?.tenant_id || targetProfile?.tenant_id !== callerProfile.tenant_id) {
        throw new Error("Sem permissão para excluir este usuário");
      }
      // Prevent admins/coordenadores from deleting a super_admin
      const { data: targetRoles } = await adminClient
        .from("user_roles").select("role").eq("user_id", user_id);
      if ((targetRoles || []).some((r: any) => r.role === "super_admin")) {
        throw new Error("Sem permissão para excluir este usuário");
      }
    }

    // Delete related data in order
    await adminClient.from("user_permissions").delete().eq("user_id", user_id);
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
