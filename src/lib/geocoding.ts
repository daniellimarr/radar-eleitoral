import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeoResult {
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export async function geocodeByCep(cep: string): Promise<GeoResult | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const { data, error } = await supabase.functions.invoke("geocode-cep", {
      body: { cep: cleanCep },
    });

    if (error) {
      console.error("Geocoding error:", error);
      toast.error("Erro ao buscar CEP");
      return null;
    }

    if (data?.error) {
      toast.error(data.error);
      return null;
    }

    return {
      address: data.address || undefined,
      neighborhood: data.neighborhood || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
    };
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}
