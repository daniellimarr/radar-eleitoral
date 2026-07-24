import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAuthorizedAdmin } from "./authorize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateTempPassword(len = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%*?";
  const all = upper + lower + digits + symbols;
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  const pick = (set: string, b: number) => set[b % set.length];
  const chars = [
    pick(upper, bytes[0]),
    pick(lower, bytes[1]),
    pick(digits, bytes[2]),
    pick(symbols, bytes[3]),
  ];
  for (let i = 4; i < len; i++) chars.push(pick(all, bytes[i]));
  return chars.sort(() => Math.random() - 0.5).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const authorized = await isAuthorizedAdmin(adminClient, caller.id);
    if (!authorized) throw new Error("Only super_admin can reset passwords");

    const { user_id } = await req.json();
    if (!user_id) throw new Error("user_id required");

    const tempPassword = generateTempPassword(12);

    const { error: updErr } = await adminClient.auth.admin.updateUser(user_id, {
      password: tempPassword,
    });
    if (updErr) throw updErr;

    await adminClient
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", user_id);

    return new Response(
      JSON.stringify({ success: true, temp_password: tempPassword }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
