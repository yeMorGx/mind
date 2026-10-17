import Stripe from "stripe";
import { adminClient, apiError, ServiceError, stripeClient } from "@/lib/billing/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
 try {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new ServiceError("Webhook não configurado.", 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) throw new ServiceError("Assinatura ausente.");
  if (Number(request.headers.get("content-length") || 0) > 1000000) throw new ServiceError("Payload muito grande.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceError("Payload ausente.");
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 1000000) { await reader.cancel(); throw new ServiceError("Payload muito grande.", 413); } chunks.push(part.value); }
  const bytes = Buffer.concat(chunks);
  const raw = bytes.toString("utf8");
  const stripe = stripeClient();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(raw, signature, secret); }
  catch { throw new ServiceError("Assinatura inválida."); }
  const admin = adminClient();
  const previous = await admin.from("mind_stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (previous.error) throw new Error("Webhook store unavailable");
  if (previous.data) return Response.json({ received: true });
  let subscriptionId: string | undefined;
  if (event.type.startsWith("customer.subscription.")) subscriptionId = (event.data.object as Stripe.Subscription).id;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
   const sub = (event.data.object as Stripe.Checkout.Session).subscription;
   subscriptionId = typeof sub === "string" ? sub : sub?.id;
  }
  if (!subscriptionId) return Response.json({ received: true });
  // Read current Stripe state, not a stale event snapshot or the checkout redirect.
  const observed = new Date().toISOString();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const account = await admin.from("mind_subscriptions").select("actor_id,subscription_id,status").eq("customer_id", customer).maybeSingle();
  if (account.error) throw new Error("Account store unavailable");
  if (!account.data) return Response.json({ received: true }); // Other Stripe products may share the account.
  if (subscription.metadata.mind_actor_id !== account.data.actor_id) throw new Error("Subscription ownership mismatch");
  if (account.data.subscription_id && account.data.subscription_id !== subscription.id && !["canceled", "incomplete_expired"].includes(account.data.status)) {
   if (["canceled", "incomplete_expired"].includes(subscription.status)) return Response.json({ received: true });
   throw new Error("A second subscription requires administrative review");
  }
  const items = subscription.items.data;
  if (items.length !== 1 || items[0].quantity !== 1) throw new Error("Unsupported subscription items");
  const price = items[0].price.id;
  const allowed = (["plus", "premium"] as const).find(plan => [process.env[`STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY`], process.env[`STRIPE_PRICE_${plan.toUpperCase()}_YEARLY`]].filter(Boolean).includes(price));
  if (!allowed) throw new Error("Unknown subscription price");
  const result = await admin.rpc("mind_apply_subscription", {
   event_id: event.id, actor: account.data.actor_id, customer, subscription: subscription.id,
   new_plan: allowed, new_status: subscription.status,
   starts_at: new Date(items[0].current_period_start * 1000).toISOString(),
   ends_at: new Date(items[0].current_period_end * 1000).toISOString(),
   cancel_pending: subscription.cancel_at_period_end, observed,
  });
  if (result.error) throw new Error("Subscription update failed");
  return Response.json({ received: true });
 } catch (error) { return apiError(error); }
}
