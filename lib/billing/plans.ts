export type PaidPlan = "plus" | "premium";
export type PlanId = "free" | PaidPlan;
export type Cadence = "monthly" | "yearly";
export const PLANS = {
 free: { name: "Free", monthly: 0, yearly: 0, publications: 5, features: ["2 novos prompts por dia", "5 publicações", "Perfil público e favoritos", "Reabra os prompts já desbloqueados"] },
 plus: { name: "Plus", monthly: 1990, yearly: 19104, publications: 50, features: ["100 novos prompts por mês", "50 publicações", "Acesso contínuo aos desbloqueados", "Gerencie sua assinatura pelo Stripe"] },
 premium: { name: "Premium", monthly: 3990, yearly: 38304, publications: null, features: ["Desbloqueios ilimitados", "Publicações ilimitadas", "Acesso contínuo aos desbloqueados", "Gerencie sua assinatura pelo Stripe"] },
} as const;
export const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
export type BillingStatus = { enabled: boolean; plan: PlanId; status: string; used: number; limit: number | null; remaining: number | null; resetsAt: string; periodEnd: string | null; cancelAtPeriodEnd: boolean; hasCustomer: boolean; hasSubscription: boolean };
export type Entitlement = { unlocked: boolean; content?: string; limitReached?: boolean; billing: BillingStatus };
