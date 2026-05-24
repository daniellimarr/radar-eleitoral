export type EngagementLevel = 
  | "nao_trabalhado" 
  | "em_prospeccao" 
  | "conquistado" 
  | "criando_envolvimento" 
  | "falta_trabalhar" 
  | "envolvimento_perdido";

export interface Contact {
  id: string;
  name: string;
  nickname: string | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  has_whatsapp: boolean;
  cep: string | null;
  address: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  voting_zone: string | null;
  voting_section: string | null;
  voting_location: string | null;
  engagement: EngagementLevel;
  is_leader: boolean;
  leader_id: string | null;
  tenant_id: string;
  registered_by: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Campaign {
  id: string;
  nome_campanha: string;
  cargo: string;
  cidade: string | null;
  estado: string | null;
  partido: string | null;
  numero: string | null;
  meta_votos: number;
  limite_gastos: number;
  status: "pre_campanha" | "campanha" | "encerrada";
  tenant_id: string;
  created_at: string;
}
