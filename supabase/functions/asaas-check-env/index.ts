import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error: "Unauthorized" }, 200);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return json({ ok: false, error: "Unauthorized" }, 200);
    }

    // Only super_admin / admin_gabinete / developer can view
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    const allowed = ["super_admin", "admin_gabinete", "developer"].some((r) => roleSet.has(r));
    if (!allowed) return json({ ok: false, error: "Forbidden" }, 200);

    const configuredEnv = (Deno.env.get("ASAAS_ENV") || "sandbox").toLowerCase();
    const apiKey = Deno.env.get("ASAAS_API_KEY") || "";
    const hasKey = apiKey.length > 0;

    const baseUrl = configuredEnv === "production"
      ? "https://api.asaas.com/v3"
      : "https://sandbox.asaas.com/api/v3";

    let reachable = false;
    let detectedEnv: "production" | "sandbox" | "unknown" = "unknown";
    let httpStatus: number | null = null;
    let accountName: string | null = null;
    let errorMessage: string | null = null;

    if (hasKey) {
      try {
        const res = await fetch(`${baseUrl}/myAccount`, {
          headers: { "access_token": apiKey },
        });
        httpStatus = res.status;
        reachable = res.ok;
        if (res.ok) {
          const data = await res.json();
          accountName = data?.name || data?.email || null;
          detectedEnv = configuredEnv === "production" ? "production" : "sandbox";
        } else {
          const text = await res.text();
          errorMessage = text.slice(0, 300);
        }
      } catch (e) {
        errorMessage = e instanceof Error ? e.message : String(e);
      }
    }

    const matches = hasKey && reachable && detectedEnv === configuredEnv;

    return json({
      ok: true,
      configured_env: configuredEnv,
      base_url: baseUrl,
      has_api_key: hasKey,
      api_key_preview: hasKey ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}` : null,
      reachable,
      http_status: httpStatus,
      detected_env: detectedEnv,
      account_name: accountName,
      matches,
      error: errorMessage,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ASAAS-CHECK-ENV] ERROR:", msg);
    return json({ ok: false, error: msg }, 200);
  }
});
