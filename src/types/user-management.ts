export interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  modules: string[];
  status: string;
}

export const AVAILABLE_MODULES = [
  { key: "dashboard", label: "Início / Dashboard" },
  { key: "contacts", label: "Cadastro de Contatos" },
  { key: "demands", label: "Demandas" },
  { key: "appointments", label: "Agenda" },
  { key: "leaders", label: "Lideranças" },
  { key: "vehicles", label: "Veículos" },
  { key: "materials", label: "Material de Campanha" },
  { key: "visit_requests", label: "Solicitações de Visita" },
  { key: "registration_links", label: "Links de Cadastro" },
  { key: "map", label: "Mapa / Georreferenciamento" },
  { key: "reports", label: "Relatórios" },
  { key: "chat", label: "Chat Interno" },
  { key: "campaigns", label: "Campanhas" },
  { key: "marketing", label: "Marketing" },
  { key: "campaign_files", label: "Arquivos da Campanha" },
] as const;

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_gabinete: "Admin do Gabinete",
  coordenador: "Coordenador",
  assessor: "Assessor",
  operador: "Liderança",
};
