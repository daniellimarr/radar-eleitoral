import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Não autorizado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Não autorizado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's tenant
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ ok: false, error: "Tenant não encontrado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contacts with CEP but no coordinates
    const { data: contacts, error: fetchError } = await adminClient
      .from("contacts")
      .select("id, cep")
      .eq("tenant_id", profile.tenant_id)
      .is("deleted_at", null)
      .is("latitude", null)
      .not("cep", "is", null)
      .not("cep", "eq", "");

    if (fetchError) {
      return new Response(JSON.stringify({ ok: false, error: "Erro ao buscar contatos" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0, total: 0, message: "Nenhum contato pendente de geolocalização" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    const total = contacts.length;
    const batchSize = 50; // Process in batches to avoid timeout

    for (let i = 0; i < Math.min(contacts.length, batchSize); i++) {
      const contact = contacts[i];
      const cleanCep = contact.cep?.replace(/\D/g, "") || "";
      if (cleanCep.length !== 8) continue;

      try {
        // Use BrasilAPI
        const brasilRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        if (!brasilRes.ok) continue;

        const brasilData = await brasilRes.json();
        let lat = brasilData.location?.coordinates?.latitude || null;
        let lng = brasilData.location?.coordinates?.longitude || null;

        // Fallback to Nominatim if no coordinates
        if (!lat || !lng) {
          const query = [brasilData.street, brasilData.neighborhood, brasilData.city, brasilData.state, "Brazil"]
            .filter(Boolean)
            .join(", ");

          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            { headers: { "User-Agent": "GabineteOnline/1.0", "Accept-Language": "pt-BR" } }
          );
          const geoData = await geoRes.json();
          if (geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }
        }

        if (lat && lng) {
          const updateData: Record<string, unknown> = { latitude: lat, longitude: lng };
          // Also fill address fields if empty
          if (brasilData.street) updateData.address = brasilData.street;
          if (brasilData.neighborhood) updateData.neighborhood = brasilData.neighborhood;
          if (brasilData.city) updateData.city = brasilData.city;
          if (brasilData.state) updateData.state = brasilData.state;

          const { error: updateError } = await adminClient
            .from("contacts")
            .update(updateData)
            .eq("id", contact.id);

          if (!updateError) updated++;
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch {
        // Skip individual errors
        continue;
      }
    }

    const remaining = Math.max(0, total - batchSize);

    return new Response(JSON.stringify({
      ok: true,
      updated,
      total,
      remaining,
      message: `${updated} contato(s) geolocalizado(s) de ${Math.min(total, batchSize)} processados.${remaining > 0 ? ` Restam ${remaining} para processar.` : ""}`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Batch geocode error:", msg);
    return new Response(JSON.stringify({ ok: false, error: "Erro interno ao geocodificar" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
