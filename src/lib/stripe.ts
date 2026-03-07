// Kirvano plan configuration for Radar Eleitoral
export const PLANS = {
  bronze: {
    name: "Bronze",
    price: 259,
    checkout_url: "https://pay.kirvano.com/2006a996-3eb3-4d48-990b-a910c4f88c74",
    contact_limit: 5000,
    user_limit: 2,
    features: [
      "1 a 2 usuários",
      "Até 5.000 contatos",
      "Acesso APP e plataforma WEB",
      "Treinamento por vídeo-aulas e online com equipe de suporte",
      "Suporte whatsapp, ligação e e-mail",
    ],
  },
  prata: {
    name: "Prata",
    price: 329,
    checkout_url: "", // TODO: adicionar URL da Kirvano
    contact_limit: 10000,
    user_limit: 5,
    features: [
      "3 a 5 usuários",
      "Até 10.000 contatos",
      "Acesso APP e plataforma WEB",
      "Treinamento por vídeo-aulas e online com equipe de suporte",
      "Suporte whatsapp, ligação e e-mail",
    ],
    popular: true,
  },
  ouro: {
    name: "Ouro",
    price: 499,
    checkout_url: "", // TODO: adicionar URL da Kirvano
    contact_limit: 20000,
    user_limit: 10,
    features: [
      "6 a 10 usuários",
      "Até 20.000 contatos",
      "Acesso APP e plataforma WEB",
      "Treinamento por vídeo-aulas e online com equipe de suporte",
      "Suporte whatsapp, ligação e e-mail",
      "Geo-referenciamento (mapas)",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByName(name: string): (typeof PLANS)[PlanKey] | null {
  for (const key of Object.keys(PLANS) as PlanKey[]) {
    if (PLANS[key].name.toLowerCase() === name.toLowerCase()) return PLANS[key];
  }
  return null;
}

export function getPlanLimits(planName: string | null) {
  if (!planName) return { contact_limit: 5000, user_limit: 2 };
  const plan = getPlanByName(planName);
  if (!plan) return { contact_limit: 5000, user_limit: 2 };
  return { contact_limit: plan.contact_limit, user_limit: plan.user_limit };
}

