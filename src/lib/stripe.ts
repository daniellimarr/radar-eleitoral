// Stripe product/price mapping for Radar Eleitoral plans
export const PLANS = {
  starter: {
    name: "Starter",
    price: 97,
    price_id: "price_1T7xuAPOKYKwOvrYXmwdtJCK",
    product_id: "prod_U6AETeW1R4YTFX",
    features: [
      "Até 1.000 contatos",
      "5 usuários",
      "Módulos básicos",
      "Suporte por email",
    ],
  },
  profissional: {
    name: "Profissional",
    price: 197,
    price_id: "price_1T7xuTPOKYKwOvrYcNnOFn9J",
    product_id: "prod_U6AEBOQn4YVFqY",
    features: [
      "Até 5.000 contatos",
      "15 usuários",
      "Todos os módulos",
      "Georeferenciamento",
      "Suporte prioritário",
    ],
    popular: true,
  },
  agencia: {
    name: "Agência",
    price: 397,
    price_id: "price_1T7xurPOKYKwOvrYyaj2QKOr",
    product_id: "prod_U6AFsHEZxAaTPb",
    features: [
      "Contatos ilimitados",
      "Usuários ilimitados",
      "Todos os módulos premium",
      "Multi-campanha",
      "API de integração",
      "Gerente de conta dedicado",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string): (typeof PLANS)[PlanKey] | null {
  for (const key of Object.keys(PLANS) as PlanKey[]) {
    if (PLANS[key].product_id === productId) return PLANS[key];
  }
  return null;
}

export function getPlanByPriceId(priceId: string): (typeof PLANS)[PlanKey] | null {
  for (const key of Object.keys(PLANS) as PlanKey[]) {
    if (PLANS[key].price_id === priceId) return PLANS[key];
  }
  return null;
}
