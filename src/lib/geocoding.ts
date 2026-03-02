import { toast } from "sonner";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

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
    // Step 1: Fetch address from ViaCEP
    const viaRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const viaData: ViaCepResponse = await viaRes.json();
    if (viaData.erro) {
      toast.error("CEP não encontrado");
      return null;
    }

    const result: GeoResult = {
      address: viaData.logradouro || undefined,
      neighborhood: viaData.bairro || undefined,
      city: viaData.localidade || undefined,
      state: viaData.uf || undefined,
    };

    // Step 2: Geocode using Nominatim (OpenStreetMap)
    const query = [viaData.logradouro, viaData.bairro, viaData.localidade, viaData.uf, "Brazil"]
      .filter(Boolean)
      .join(", ");

    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { "Accept-Language": "pt-BR" } }
    );
    const geoData = await geoRes.json();

    if (geoData.length > 0) {
      result.latitude = parseFloat(geoData[0].lat);
      result.longitude = parseFloat(geoData[0].lon);
    }

    return result;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}
