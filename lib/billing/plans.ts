export type PaidPlan = "plus" | "premium";
export type PlanId = "free" | PaidPlan;
export type Cadence = "monthly" | "yearly";
export const PLANS = {
 free: { name: "Free", monthly: 0, yearly: 0, publications: 5, features: ["2 cópias de prompts por dia", "5 publicações", "Perfil público e favoritos", "Cada cópia conta um uso"] },
 plus: { name: "Plus", monthly: 1990, yearly: 19104, publications: 50, features: ["100 cópias de prompts por mês", "50 publicações", "Acesse seus prompts desbloqueados", "Gerencie sua assinatura pelo Stripe"] },
 premium: { name: "Premium", monthly: 3990, yearly: 38304, publications: null, features: ["Cópias ilimitadas", "Publicações ilimitadas", "Acesse seus prompts desbloqueados", "Gerencie sua assinatura pelo Stripe"] },
} as const;
export const money = (cents: number, locale = "en-US") => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(cents / 100);
export type BillingStatus = { activationId?: string | null; complimentary?: boolean; enabled: boolean; plan: PlanId; status: string; used: number; limit: number | null; remaining: number | null; resetsAt: string; periodEnd: string | null; cancelAtPeriodEnd: boolean; hasCustomer: boolean; hasSubscription: boolean };
export type Entitlement = { unlocked: boolean; content?: string; limitReached?: boolean; billing: BillingStatus };
