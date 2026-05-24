import { EngagementLevel } from "@/types";

export const ENGAGEMENT_OPTIONS: { value: EngagementLevel; label: string }[] = [
  { value: "nao_trabalhado", label: "Não trabalhado" },
  { value: "em_prospeccao", label: "Em prospecção" },
  { value: "conquistado", label: "Conquistado" },
  { value: "criando_envolvimento", label: "Criando envolvimento" },
  { value: "falta_trabalhar", label: "Falta trabalhar" },
  { value: "envolvimento_perdido", label: "Envolvimento perdido" },
];

export const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export const CAMPAIGN_CARGO_OPTIONS = [
  "Vereador", 
  "Prefeito", 
  "Deputado Estadual", 
  "Deputado Federal", 
  "Senador", 
  "Governador"
];

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: "pre_campanha", label: "Pré-Campanha" },
  { value: "campanha", label: "Campanha Oficial" },
  { value: "encerrada", label: "Encerrada" },
];
