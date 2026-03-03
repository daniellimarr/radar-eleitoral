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
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ error: "Tenant não encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { calendarId, timeMin, timeMax } = await req.json();

    if (!calendarId) {
      return new Response(JSON.stringify({ error: "calendarId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch events from Google Calendar API
    const params = new URLSearchParams({
      key: GOOGLE_API_KEY,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    if (timeMin) params.set("timeMin", timeMin);
    if (timeMax) params.set("timeMax", timeMax);

    const gcalUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    const gcalRes = await fetch(gcalUrl);

    if (!gcalRes.ok) {
      const errBody = await gcalRes.text();
      console.error("Google Calendar API error:", gcalRes.status, errBody);
      throw new Error(`Erro ao acessar Google Calendar (${gcalRes.status}). Verifique se o calendário é público e o ID está correto.`);
    }

    const gcalData = await gcalRes.json();
    const events = gcalData.items || [];

    // Insert events into appointments table
    let imported = 0;
    let skipped = 0;

    for (const event of events) {
      const startTime = event.start?.dateTime || (event.start?.date ? `${event.start.date}T00:00:00` : null);
      const endTime = event.end?.dateTime || (event.end?.date ? `${event.end.date}T23:59:59` : null);
      const title = event.summary || "Sem título";

      if (!startTime) {
        skipped++;
        continue;
      }

      // Check if already imported (by title + start_time to avoid duplicates)
      const { data: existing } = await supabase
        .from("appointments")
        .select("id")
        .eq("tenant_id", profile.tenant_id)
        .eq("title", title)
        .eq("start_time", startTime)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error: insertError } = await supabase.from("appointments").insert({
        tenant_id: profile.tenant_id,
        title,
        description: event.description || null,
        start_time: startTime,
        end_time: endTime || null,
        location: event.location || null,
        created_by: user.id,
        status: "a_confirmar",
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        skipped++;
      } else {
        imported++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, imported, skipped, total: events.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
