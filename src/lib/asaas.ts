// Asaas plan configuration for Radar Eleitoral
export const ASAAS_PLANS = {
  mensal: {
    key: "mensal",
    name: "Mensal",
    price: 97,
    period: "/mês",
    cycle: "MONTHLY",
    contact_limit: 5000,
    user_limit: 5,
    features: [
      "Até 5 usuários",
      "Até 5.000 contatos",
      "Acesso APP e plataforma WEB",
      "Treinamento por vídeo-aulas",
      "Suporte WhatsApp e e-mail",
    ],
  },
  trimestral: {
    key: "trimestral",
    name: "Trimestral",
    price: 247,
    period: "/trimestre",
    cycle: "QUARTERLY",
    contact_limit: 10000,
    user_limit: 10,
    popular: true,
    features: [
      "Até 10 usuários",
      "Até 10.000 contatos",
      "Acesso APP e plataforma WEB",
      "Treinamento por vídeo-aulas e online",
      "Suporte WhatsApp, ligação e e-mail",
    ],
  },
  anual: {
    key: "anual",
    name: "Anual",
    price: 697,
    period: "/ano",
    cycle: "YEARLY",
    contact_limit: 20000,
    user_limit: 20,
    features: [
      "Até 20 usuários",
      "Até 20.000 contatos",
      "Acesso APP e plataforma WEB",
      "Treinamento completo com equipe",
      "Suporte prioritário",
      "Geo-referenciamento (mapas)",
    ],
  },
} as const;

export type AsaasPlanKey = keyof typeof ASAAS_PLANS;

export function getPlanByName(name: string) {
  for (const key of Object.keys(ASAAS_PLANS) as AsaasPlanKey[]) {
    if (ASAAS_PLANS[key].name.toLowerCase() === name.toLowerCase()) {
      return ASAAS_PLANS[key];
    }
  }
  return null;
}

export function getPlanLimits(planName: string | null) {
  if (!planName) return { contact_limit: 5000, user_limit: 5 };
  const plan = getPlanByName(planName);
  if (!plan) return { contact_limit: 5000, user_limit: 5 };
  return { contact_limit: plan.contact_limit, user_limit: plan.user_limit };
}
