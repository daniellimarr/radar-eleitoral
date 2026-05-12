import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { respond, handleOptions } from "../_shared/responses.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond(false, { error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return respond(false, { error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRoleSet = new Set((callerRoles || []).map((r: any) => r.role));
    const isSuperAdmin = callerRoleSet.has("super_admin");
    const isAdminGabinete = callerRoleSet.has("admin_gabinete");
    const isCoordenador = callerRoleSet.has("coordenador");

    if (!isSuperAdmin && !isAdminGabinete && !isCoordenador) {
      return respond(false, { error: "Sem permissão para excluir usuários" }, 403);
    }

    const { user_id } = await req.json();
    if (!user_id) return respond(false, { error: "user_id é obrigatório" }, 400);
    if (user_id === caller.id) return respond(false, { error: "Não é possível excluir a si mesmo" }, 400);

    // Tenant isolation: target must belong to caller's tenant (unless super_admin)
    const { data: callerProfile } = await adminClient
      .from("profiles").select("tenant_id").eq("user_id", caller.id).single();
    const { data: targetProfile } = await adminClient
      .from("profiles").select("tenant_id").eq("user_id", user_id).single();

    if (!targetProfile) return respond(false, { error: "Usuário não encontrado" }, 404);

    if (!isSuperAdmin && targetProfile.tenant_id !== callerProfile?.tenant_id) {
      return respond(false, { error: "Acesso negado: usuário pertence a outro gabinete" }, 403);
    }

    // Role hierarchy: coordenador cannot delete admin_gabinete or super_admin users
    const { data: targetRoles } = await adminClient
      .from("user_roles").select("role").eq("user_id", user_id);
    const targetRoleSet = new Set((targetRoles || []).map((r: any) => r.role));

    if (targetRoleSet.has("super_admin") && !isSuperAdmin) {
      return respond(false, { error: "Sem permissão para excluir super administrador" }, 403);
    }
    if (targetRoleSet.has("admin_gabinete") && !isSuperAdmin && !isAdminGabinete) {
      return respond(false, { error: "Coordenadores não podem excluir administradores" }, 403);
    }

    // Delete related data in order
    await adminClient.from("user_permissions").delete().eq("user_id", user_id);
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) return respond(false, { error: deleteError.message }, 500);

    // Audit log
    await adminClient.from("audit_logs").insert({
      user_id: caller.id,
      tenant_id: callerProfile?.tenant_id ?? null,
      action: "delete_user",
      entity: "auth.users",
      entity_id: user_id,
      details: { target_tenant_id: targetProfile.tenant_id, target_roles: Array.from(targetRoleSet) },
    });

    return respond(true, { success: true });
  } catch (err: any) {
    return respond(false, { error: err.message }, 500);
  }
});
