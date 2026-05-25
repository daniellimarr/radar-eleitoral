
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
    const body = await req.json();
    const { cep, address, city, state } = body;
    
    let result: Record<string, unknown> = {
      address: address || null,
      neighborhood: null,
      city: city || null,
      state: state || null,
      latitude: null,
      longitude: null,
    };

    if (cep) {
      const cleanCep = cep.replace(/\D/g, "");
      if (cleanCep.length === 8) {
        // Step 1: BrasilAPI for address + coordinates
        try {
          const brasilRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
          if (brasilRes.ok) {
            const brasilData = await brasilRes.json();
            result.address = brasilData.street || result.address;
            result.neighborhood = brasilData.neighborhood || null;
            result.city = brasilData.city || result.city;
            result.state = brasilData.state || result.state;
            result.latitude = brasilData.location?.coordinates?.latitude || null;
            result.longitude = brasilData.location?.coordinates?.longitude || null;
          }
        } catch (e) {
          console.error("BrasilAPI error:", e);
        }
      }
    }

    // Step 2: If no coordinates, try Nominatim with full address
    if (!result.latitude || !result.longitude) {
      const queryParts = [];
      if (result.address) queryParts.push(result.address);
      if (result.neighborhood) queryParts.push(result.neighborhood);
      if (result.city) queryParts.push(result.city);
      if (result.state) queryParts.push(result.state);
      queryParts.push("Brazil");

      const query = queryParts.filter(Boolean).join(", ");

      if (query.length > 10) { // Only if we have some meaningful address info
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
