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

    const allowedRoles = ["super_admin", "admin_gabinete", "coordenador"];
    const hasPermission = callerRoles?.some((r: any) => allowedRoles.includes(r.role));
    if (!hasPermission) return respond(false, { error: "Sem permissão para excluir usuários" }, 403);

    const { user_id } = await req.json();
    if (!user_id) return respond(false, { error: "user_id é obrigatório" }, 400);

    if (user_id === caller.id) return respond(false, { error: "Não é possível excluir a si mesmo" }, 400);

    // Delete related data in order
    await adminClient.from("user_permissions").delete().eq("user_id", user_id);
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) return respond(false, { error: deleteError.message }, 500);

    return respond(true, { success: true });
  } catch (err: any) {
    return respond(false, { error: err.message }, 500);
  }
});
