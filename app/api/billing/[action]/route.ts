import { apiError, assertOrigin, billingEnabled, databaseError, identity, isOwner, noStore, priceId, readBody, ServiceError, siteUrl, stripeClient } from "@/lib/billing/server";
import { PLANS, type Cadence, type PaidPlan } from "@/lib/billing/plans";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
export async function GET(_request: Request, context: Context) {
 const { action } = await context.params;
 if (action !== "config") return Response.json({ error: "Página não encontrada." }, { status: 404 });
 let enabled = false;
 try { enabled = await billingEnabled(); } catch { /* Rollout remains off until configured. */ }
 const checkout = enabled && process.env.BILLING_CHECKOUT_ENABLED === "true" && Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
 return Response.json({ enabled, checkout, available: Object.fromEntries((["plus", "premium"] as const).map(plan => [plan, { monthly: checkout && Boolean(process.env[`STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY`]), yearly: checkout && Boolean(process.env[`STRIPE_PRICE_${plan.toUpperCase()}_YEARLY`]) }])) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request, context: Context) {
 try {
  assertOrigin(request);
  const { action } = await context.params;
  const { actor, admin } = await identity(request);
  const body = await readBody(request);
  if (action === "status") {
   const result = await admin.rpc("mind_billing_status", { actor }); databaseError(result.error);
   // Stable per subscription/plan, scoped to the authenticated account; renewals do not replay the ticket.
   let activationId: string | null = null;
   if (result.data?.enabled && result.data.plan !== "free" && ["active", "trialing"].includes(result.data.status)) {
    const subscription = await admin.from("mind_subscriptions").select("subscription_id").eq("actor_id", actor).maybeSingle(); databaseError(subscription.error);
    if (subscription.data?.subscription_id) activationId = `${subscription.data.subscription_id}:${result.data.plan}`;
   }
   return Response.json({ ...result.data, activationId, canManageInquiries: await isOwner(actor) }, { headers: noStore });
  }
  if (action === "prompt" || action === "unlock") {
   const creator = typeof body.creatorId === "string" ? body.creatorId : "", prompt = typeof body.promptId === "string" ? body.promptId : "";
   if (![creator, prompt].every(value => /^[A-Za-z0-9_-]{1,128}$/.test(value))) throw new ServiceError("Prompt inválido.");
   const result = await admin.rpc("mind_prompt_entitlement", { actor, creator, prompt, consume: action === "unlock" }); databaseError(result.error);
   return Response.json(result.data, { headers: noStore });
  }
  if (action === "access-state") {
   const prompt = typeof body.promptId === "string" ? body.promptId : "";
   if (!/^[A-Za-z0-9_-]{1,128}$/.test(prompt)) throw new ServiceError("Prompt inválido.");
   const [native, legacy] = await Promise.all([admin.from("mind_public_prompts").select("prompt_id").eq("creator_id", actor).eq("prompt_id", prompt).maybeSingle(), admin.from("mind_directory_prompts").select("prompt_id").eq("creator_id", actor).eq("prompt_id", prompt).maybeSingle()]);
   databaseError(native.error); databaseError(legacy.error);
   if (!native.data && !legacy.data) throw new ServiceError("Publicação não encontrada.", 404);
   const result = await admin.from("mind_prompt_access").select("access_mode").eq("creator_id", actor).eq("prompt_id", prompt).maybeSingle(); databaseError(result.error);
   return Response.json({ mode: result.data?.access_mode ?? "metered" }, { headers: noStore });
  }
  if (action === "access") {
   const prompt = typeof body.promptId === "string" ? body.promptId : "";
   if (!/^[A-Za-z0-9_-]{1,128}$/.test(prompt) || !["free", "metered"].includes(String(body.mode))) throw new ServiceError("Confira a opção de acesso.");
   const result = await admin.rpc("mind_set_prompt_access", { actor, prompt, chosen_mode: body.mode }); databaseError(result.error);
   return Response.json({ saved: true }, { headers: noStore });
  }
  if (action === "portal") {
   const { data, error } = await admin.from("mind_subscriptions").select("customer_id").eq("actor_id", actor).maybeSingle(); databaseError(error);
   if (!data?.customer_id) throw new ServiceError("Você ainda não tem uma assinatura para gerenciar.");
   const portal = await stripeClient().billingPortal.sessions.create({ customer: data.customer_id, return_url: `${siteUrl()}/home/billing` });
   return Response.json({ url: portal.url }, { headers: noStore });
  }
  if (action !== "checkout") throw new ServiceError("Ação não encontrada.", 404);
  if (process.env.BILLING_CHECKOUT_ENABLED !== "true" || !process.env.STRIPE_WEBHOOK_SECRET || !await billingEnabled()) throw new ServiceError("As assinaturas ainda estão em preparação.", 503);
  if (!["plus", "premium"].includes(String(body.plan)) || !["monthly", "yearly"].includes(String(body.cadence))) throw new ServiceError("Escolha um plano e uma frequência.");
  const plan = body.plan as PaidPlan, cadence = body.cadence as Cadence;
  const price = priceId(plan, cadence), stripe = stripeClient();
  const actualPrice = await stripe.prices.retrieve(price);
  if (!actualPrice.active || actualPrice.currency !== "brl" || actualPrice.unit_amount !== PLANS[plan][cadence] || actualPrice.recurring?.interval !== (cadence === "yearly" ? "year" : "month") || actualPrice.recurring.interval_count !== 1 || actualPrice.recurring.usage_type !== "licensed") throw new ServiceError("Este plano está temporariamente indisponível. Tente novamente mais tarde.", 503);
  const reserved = await admin.rpc("mind_reserve_checkout", { actor, chosen_plan: plan, cadence }); databaseError(reserved.error);
  let customer = reserved.data.customerId as string | null;
  if (!customer) {
   const value = await stripe.customers.create({ metadata: { mind_actor_id: actor } }, { idempotencyKey: `mind-customer-v1:${actor}` });
   const saved = await admin.from("mind_subscriptions").update({ customer_id: value.id }).eq("actor_id", actor).is("customer_id", null); databaseError(saved.error);
   const current = await admin.from("mind_subscriptions").select("customer_id").eq("actor_id", actor).single(); databaseError(current.error);
   customer = current.data!.customer_id;
  }
  const session = await stripe.checkout.sessions.create({
   mode: "subscription", customer: customer!, client_reference_id: actor,
   line_items: [{ price, quantity: 1 }],
   metadata: { mind_actor_id: actor }, subscription_data: { metadata: { mind_actor_id: actor } },
   success_url: `${siteUrl()}/home/billing?checkout=success`, cancel_url: `${siteUrl()}/plans?checkout=canceled`,
   expires_at: Math.floor(new Date(reserved.data.expiresAt).getTime() / 1000),
   locale: "pt-BR", billing_address_collection: "auto",
  }, { idempotencyKey: `mind-checkout-v1:${reserved.data.key}` });
  if (session.status !== "open" || !session.url) throw new ServiceError("Este checkout já foi concluído ou expirou. Confira sua assinatura e tente novamente.", 409);
  return Response.json({ url: session.url }, { headers: noStore });
 } catch (error) { return apiError(error); }
}
