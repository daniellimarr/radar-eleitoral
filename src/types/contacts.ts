export interface Contact {
  id: string;
  tenant_id: string;
  name: string;
  nickname: string | null;
  gender: string | null;
  birth_date: string | null;
  cpf: string | null;
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
  engagement: 'nao_trabalhado' | 'apoiador' | 'militante' | 'oposicao' | 'indeciso';
  is_leader: boolean;
  leader_id: string | null;
  registered_by: string | null;
  latitude: number | null;
  longitude: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  leader_name?: string | null;
}

export interface Leader {
  id: string;
  contact_id: string;
  tenant_id: string;
  created_at: string;
}
