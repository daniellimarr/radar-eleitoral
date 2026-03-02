import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cep } = await req.json();
    const cleanCep = cep?.replace(/\D/g, "");
    
    if (!cleanCep || cleanCep.length !== 8) {
      return new Response(JSON.stringify({ error: "CEP inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: BrasilAPI for address + coordinates
    const brasilRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    
    if (!brasilRes.ok) {
      return new Response(JSON.stringify({ error: "CEP não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brasilData = await brasilRes.json();

    const result: Record<string, unknown> = {
      address: brasilData.street || null,
      neighborhood: brasilData.neighborhood || null,
      city: brasilData.city || null,
      state: brasilData.state || null,
      latitude: brasilData.location?.coordinates?.latitude || null,
      longitude: brasilData.location?.coordinates?.longitude || null,
    };

    // Step 2: If no coordinates from BrasilAPI, try Nominatim
    if (!result.latitude || !result.longitude) {
      const query = [brasilData.street, brasilData.neighborhood, brasilData.city, brasilData.state, "Brazil"]
        .filter(Boolean)
        .join(", ");

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "User-Agent": "GabineteOnline/1.0", "Accept-Language": "pt-BR" } }
      );
      const geoData = await geoRes.json();

      if (geoData.length > 0) {
        result.latitude = parseFloat(geoData[0].lat);
        result.longitude = parseFloat(geoData[0].lon);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Geocoding error:", msg);
    return new Response(JSON.stringify({ error: "Erro ao geocodificar", details: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
