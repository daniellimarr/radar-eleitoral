
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { id, cep, address, city, state } = body;
    
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

    // Step 2: If no coordinates, try Nominatim with progressively broader queries
    if (!result.latitude || !result.longitude) {
      const tryNominatim = async (url: string) => {
        try {
          console.log("Nominatim request:", url);
          const res = await fetch(url, {
            headers: { "User-Agent": "RadarEleitoral/1.0 (contato@radareleitoral.com.br)", "Accept-Language": "pt-BR" },
          });
          const text = await res.text();
          console.log("Nominatim status:", res.status, "body length:", text.length);
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
          }
        } catch (e) {
          console.error("Nominatim error:", e);
        }
        return null;
      };


      // 2a: Structured search (most reliable)
      if (result.address && result.city && result.state) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&street=${encodeURIComponent(
          String(result.address)
        )}&city=${encodeURIComponent(String(result.city))}&state=${encodeURIComponent(
          String(result.state)
        )}&country=Brazil&limit=1`;
        const coords = await tryNominatim(url);
        if (coords) {
          result.latitude = coords.lat;
          result.longitude = coords.lon;
        }
      }

      // 2b: Free-text fallback with neighborhood
      if (!result.latitude || !result.longitude) {
        const parts = [result.address, result.neighborhood, result.city, result.state, "Brazil"]
          .filter(Boolean)
          .join(", ");
        if (parts.length > 5) {
          const coords = await tryNominatim(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parts)}&limit=1`
          );
          if (coords) {
            result.latitude = coords.lat;
            result.longitude = coords.lon;
          }
        }
      }

      // 2c: City fallback (always returns something so user sees a pin)
      if (!result.latitude || !result.longitude) {
        const cityQuery = [result.city, result.state, "Brazil"].filter(Boolean).join(", ");
        if (cityQuery.length > 5) {
          const coords = await tryNominatim(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}&limit=1`
          );
          if (coords) {
            result.latitude = coords.lat;
            result.longitude = coords.lon;
          }
        }
      }
    }


    // If ID is provided, update the contact in the database
    if (id && result.latitude && result.longitude) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          latitude: result.latitude, 
          longitude: result.longitude,
          // Update address/neighborhood if they were null
          address: address || result.address,
          neighborhood: result.neighborhood
        })
        .eq('id', id);

      if (updateError) {
        console.error("Error updating contact coordinates:", updateError);
      } else {
        console.log(`Successfully updated coordinates for contact ${id}`);
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
