"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CreditCard, RefreshCw } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { billingRequest } from "@/lib/billing/client";
import { PLANS, type BillingStatus } from "@/lib/billing/plans";
import "./billing.css";
import ActivationTicket from "./ActivationTicket";
const paidAccess = (value: BillingStatus | null) => Boolean(value && value.enabled && value.plan !== "free" && ["active", "trialing"].includes(value.status) && value.periodEnd && new Date(value.periodEnd).getTime() > Date.now());
function BillingSession({ success }: { success: boolean }) {
 const { t, intlLocale } = useI18n();

 const { user, authReady } = useOnboarding(), { requestLogin } = useSiteLayout();
 const [status, setStatus] = useState<(BillingStatus & { canManageInquiries?: boolean }) | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [version, setVersion] = useState(0);
 const lock = useRef(false);
 useEffect(() => {
  if (!user) return; let alive = true, attempt = 0; let timer: ReturnType<typeof setTimeout> | undefined;
  async function load() { try { const value = await billingRequest<BillingStatus>(user!, "status"); if (alive) { setStatus(value); setError(""); window.dispatchEvent(new Event("mind:billing-usage")); if (success && !paidAccess(value) && ++attempt < 8) timer = setTimeout(() => void load(), 5000); } } catch (failure) { if (alive) { setStatus(null); setError(failure instanceof Error ? failure.message : "Não foi possível carregar sua assinatura."); } } finally { if (alive) setLoading(false); } }
  void load(); return () => { alive = false; clearTimeout(timer); };
 }, [user, success, version]);
 async function portal() { if (!user || lock.current) return; lock.current = true; setBusy(true); setError(""); try { const { url } = await billingRequest<{ url: string }>(user, "portal"); const destination = new URL(url); if (destination.protocol !== "https:" || destination.hostname !== "billing.stripe.com") throw new Error("Não foi possível abrir o gerenciamento da assinatura."); window.location.assign(url); } catch (failure) { setError(failure instanceof Error ? failure.message : t("Não foi possível abrir sua assinatura.")); lock.current = false; setBusy(false); } }
 if (!authReady) return <main className="billing-page"><p role="status">{t("Carregando sua conta…")}</p></main>;
 if (!user) return <main className="billing-page"><h1>{t("Sua assinatura")}</h1><p className="mt-4 text-muted">{t("Entre para consultar seu plano e as cópias disponíveis.")}</p><button type="button" className="workflow-button mt-6" onClick={requestLogin}>{t("Entrar")}</button></main>;
 return <main className="billing-page billing-account">{success && !loading && paidAccess(status) && status?.activationId && <ActivationTicket key={status.activationId} accountId={user.uid} activationId={status.activationId} memberName={user.displayName || undefined} plan={PLANS[status.plan].name}/>}<Link href="/home/settings" className="billing-text-link"><ArrowLeft size={16}/>{t("Configurações")}</Link><div className="billing-heading"><div><h1>{t("Sua assinatura")}</h1><p>{t("Seu plano, suas cópias e a próxima renovação.")}</p></div><button type="button" className="workflow-button secondary" onClick={() => { setLoading(true); setError(""); setVersion(value => value + 1); }} disabled={busy || loading}><RefreshCw size={16}/>{loading ? t("Atualizando…") : t("Atualizar")}</button></div>
  {success && !loading && <p className="billing-notice" role="status">{paidAccess(status) ? t("Assinatura confirmada pelo Stripe.") : status && ["past_due", "unpaid", "incomplete", "paused"].includes(status.status) ? t("O pagamento ainda não está confirmado. Confira a pendência no gerenciamento da assinatura.") : t("Estamos aguardando a confirmação do Stripe. O retorno do checkout, sozinho, não confirma o pagamento.")}</p>}
  {loading && <p role="status">{t("Carregando assinatura…")}</p>}{error && <p className="billing-error" role="alert">{t(error)}</p>}
  {!loading && status && <><section className="billing-account-panel"><div><CreditCard size={25} aria-hidden="true"/><h2>Mind {PLANS[status.plan].name}</h2><p>{!status.enabled ? t("As assinaturas e os limites ainda estão em preparação.") : status.complimentary ? t("Premium de cortesia. Sem cobrança.") : status.cancelAtPeriodEnd ? t("Renovação cancelada. Acesso até {v0}.", {v0: (status.periodEnd ? new Date(status.periodEnd).toLocaleDateString(intlLocale) : "o fim do período pago")}) : status.hasSubscription && status.periodEnd ? t("Próxima renovação: {v0}.", {v0: (new Date(status.periodEnd).toLocaleDateString(intlLocale))}) : t("Seu plano gratuito.")}</p>{["past_due", "unpaid", "incomplete", "paused"].includes(status.status) && <p className="billing-error">{t("Há uma pendência na assinatura. Confira o pagamento no Stripe.")}</p>}</div><div className="resource-actions"><Link href="/plans" className="workflow-button">{t("Ver planos")}{" "}<ArrowUpRight size={16}/></Link>{status.hasCustomer && <button type="button" className="workflow-button secondary" disabled={busy} onClick={() => void portal()}>{busy ? t("Abrindo…") : t("Gerenciar no Stripe")}</button>}</div></section>
   {status.enabled && <section className="billing-usage"><h2>{t("Cópias neste período")}</h2><strong>{status.limit === null ? t("Ilimitados") : t("{v0} de {v1}", {v0: (status.used), v1: (status.limit)})}</strong>{status.limit !== null && <><progress max={status.limit} value={Math.min(status.used, status.limit)} aria-label={t("Cópias utilizadas")}/><p>{status.remaining} {t("disponíveis. Renova em")}{" "}{new Date(status.resetsAt).toLocaleString(intlLocale)}.</p></>}<p>{t("Cada cópia gasta um uso, mesmo do mesmo prompt.")}</p></section>}
   {status.canManageInquiries && <Link href="/home/inbox" className="billing-text-link mt-8">{t("Candidaturas e propostas recebidas")}{" "}<ArrowUpRight size={16}/></Link>}
  </>}
 </main>;
}
export default function BillingPage({ success = false }: { success?: boolean }) { const { user } = useOnboarding(); return <BillingSession key={user?.uid ?? "visitor"} success={success}/>; }
