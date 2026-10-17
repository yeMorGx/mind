/** Run deliberately with your own Stripe account. No customer charges are created. */
import Stripe from "stripe";
import { existsSync, writeFileSync } from "node:fs";
if (!process.env.STRIPE_SECRET_KEY) throw new Error("Configure STRIPE_SECRET_KEY no ambiente deste comando. Não publique essa chave.");
if (existsSync(".env.stripe.local")) throw new Error(".env.stripe.local já existe. Preserve esse arquivo antes de gerar outra configuração.");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
const output = [];
for (const [name, monthly, yearly] of [["plus", 1990, 19104], ["premium", 3990, 38304]]) {
 for (const [cadence, amount, interval] of [["monthly", monthly, "month"], ["yearly", yearly, "year"]]) {
  const lookup = `mind_${name}_${cadence}_v1`;
  const existing = await stripe.prices.list({ lookup_keys: [lookup], limit: 1, expand: ["data.product"] });
  let price = existing.data[0];
  if (!price) {
   const product = await stripe.products.create({ name: `Mind ${name === "plus" ? "Plus" : "Premium"}`, metadata: { mind_plan: name } }, { idempotencyKey: `mind-product-v1:${name}` });
   price = await stripe.prices.create({ product: product.id, currency: "brl", unit_amount: amount, recurring: { interval }, lookup_key: lookup, metadata: { mind_plan: name, mind_cadence: cadence } }, { idempotencyKey: `mind-price-v1:${lookup}` });
  }
  if (!price.active || price.unit_amount !== amount || price.currency !== "brl" || price.recurring?.interval !== interval || price.recurring.interval_count !== 1) throw new Error(`Preço ${lookup} existe com valores diferentes. Confira no Dashboard.`);
  output.push(`STRIPE_PRICE_${name.toUpperCase()}_${cadence.toUpperCase()}=${price.id}`);
 }
}
if (process.argv.includes("--webhook")) {
 const url = "https://mind-lemon.vercel.app/api/stripe/webhook";
 const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
 if (endpoints.data.some(item => item.url === url)) console.log("Webhook já existe. Use o segredo salvo ou faça a rotação no Dashboard do Stripe.");
 else {
  const endpoint = await stripe.webhookEndpoints.create({ url, enabled_events: ["checkout.session.completed", "checkout.session.async_payment_succeeded", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"], description: "Assinaturas do Mind" });
  if (!endpoint.secret) throw new Error("O Stripe não retornou o segredo do webhook.");
  output.push(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
 }
}
// This local file is ignored by git. It contains a secret if --webhook was used.
writeFileSync(".env.stripe.local", `${output.join("\n")}\n`, { mode: 0o600, flag: "wx" });
console.log("Configuração salva em .env.stripe.local. Copie as variáveis para a Vercel e mantenha o arquivo privado. A cobrança continua desativada.");
console.log("Configure também o Customer Portal no Stripe. Permita cancelar no fim do período e trocar apenas entre os quatro preços do Mind.");
