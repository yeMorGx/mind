"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { billingRequest } from "@/lib/billing/client";
import { money, PLANS, type Cadence, type PaidPlan } from "@/lib/billing/plans";
import "./billing.css";
type Configuration = { checkout: boolean; available: Record<PaidPlan, Record<Cadence, boolean>> };
export default function PlansPage() {
 const { t, intlLocale } = useI18n();

 const { user } = useOnboarding(), { requestLogin } = useSiteLayout();
 const [cadence, setCadence] = useState<Cadence>("monthly"), [config, setConfig] = useState<Configuration | null>(null), [busy, setBusy] = useState(""), [error, setError] = useState("");
 const locked = useRef(false);
 useEffect(() => { let alive = true; void fetch("/api/billing/config", { cache: "no-store" }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(value => { if (alive) setConfig(value); }).catch(() => { if (alive) setError("Não foi possível conferir a disponibilidade dos planos. Recarregue a página para tentar novamente."); }); return () => { alive = false; }; }, []);
 async function subscribe(plan: PaidPlan) {
  if (!user) { requestLogin(); return; } if (locked.current) return; locked.current = true; setBusy(plan); setError("");
  try { const { url } = await billingRequest<{ url: string }>(user, "checkout", { plan, cadence }); const destination = new URL(url); if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") throw new Error("Não foi possível abrir o checkout."); window.location.assign(url); }
  catch (failure) { setError(failure instanceof Error ? failure.message : t("Não foi possível iniciar a assinatura.")); setBusy(""); locked.current = false; }
 }
 return <main className="billing-page plans-page">
  <div className="billing-heading"><div><h1>{t("Mais espaço para suas próximas ideias.")}</h1><p>{t("Explore com o Free ou escolha um plano para desbloquear mais prompts e compartilhar suas criações.")}</p></div><Link href="/home/billing" className="billing-text-link">{t("Minha assinatura")}{" "}<ArrowUpRight size={16}/></Link></div>
  <div className="billing-frequency" role="group" aria-label={t("Frequência da assinatura")}><button type="button" aria-pressed={cadence === "monthly"} disabled={!!busy} onClick={() => setCadence("monthly")}>{t("Mensal")}</button><button type="button" aria-pressed={cadence === "yearly"} disabled={!!busy} onClick={() => setCadence("yearly")}>{t("Anual")}{" "}<span>−20%</span></button></div>
  {config && !config.checkout && <p className="billing-notice" role="status">{t("As assinaturas estão em preparação. Por enquanto, o acesso atual continua disponível.")}</p>}
  {error && <p role="alert" className="billing-error">{t(error)}</p>}
  <div className="billing-plans-grid">{(["free", "plus", "premium"] as const).map(id => { const plan = PLANS[id], available = id !== "free" && config?.available[id]?.[cadence]; return <section key={id} className={`billing-plan${id === "plus" ? " billing-plan-featured" : ""}`} aria-labelledby={`plan-${id}`}>
   <h2 id={`plan-${id}`}>{plan.name}</h2><p className="billing-plan-audience">{id === "free" ? t("Para descobrir e experimentar.") : id === "plus" ? t("Para quem cria com frequência.") : t("Para ampliar seu ritmo de criação.")}</p>
   <div className="billing-price"><strong>{money(id === "free" ? 0 : plan[cadence], intlLocale)}</strong><span>{id === "free" ? t("sem mensalidade") : cadence === "yearly" ? t("/ ano") : t("/ mês")}</span></div>
   <p className="billing-price-note">{id === "free" ? t("Sem cartão de crédito.") : cadence === "yearly" ? t("Equivale a {v0} por mês. Cobrança anual.", {v0: (money(plan.yearly / 12, intlLocale))}) : t("Cobrança mensal. Cancele a renovação quando quiser.")}</p>
   {id === "free" ? <button type="button" className="workflow-button secondary" onClick={() => user ? window.location.assign("/explore") : requestLogin()}>{user ? t("Continuar no Mind") : t("Começar grátis")}</button> : <button type="button" className={`workflow-button${id === "plus" ? "" : " secondary"}`} disabled={!available || !!busy} onClick={() => void subscribe(id)}>{busy === id ? <><Loader2 size={16} className="animate-spin"/>{t("Abrindo checkout…")}</> : !config ? t("Conferindo…") : available ? t("Assinar {v0}", {v0: (plan.name)}) : t("Em preparação")}</button>}
   <ul>{plan.features.map(feature => <li key={feature}><Check size={16} aria-hidden="true"/>{t(feature)}</li>)}</ul>
  </section>; })}
  <section className="billing-plan billing-enterprise"><h2>Enterprise</h2><p className="billing-plan-audience">{t("Vamos conversar sobre a sua empresa.")}</p><div className="billing-price"><strong>{t("Sob consulta")}</strong></div><p className="billing-price-note">{t("Definimos juntos o escopo, o atendimento e as condições para sua equipe.")}</p><Link href="/business?subject=enterprise" className="workflow-button secondary">{t("Falar sobre Enterprise")}{" "}<ArrowUpRight size={16}/></Link><p className="billing-enterprise-note">{t("Uma proposta personalizada, antes de qualquer contratação.")}</p></section></div>
  <section className="billing-explained"><div><h2>{t("Desbloqueou uma vez. Volte quando quiser.")}</h2><p>{t("Os limites contam novos prompts desbloqueados. Copiar ou abrir novamente um prompt já liberado na sua conta não gasta outro crédito. Se o criador retirar a publicação, ela deixa de estar disponível.")}</p></div><dl><div><dt>{t("Publicações livres")}</dt><dd>{t("O criador pode deixar um prompt livre para todos. Ele não consome desbloqueios.")}</dd></div><div><dt>{t("Quando o saldo renova?")}</dt><dd>{t("No Free, diariamente à meia-noite UTC. No Plus, a cada mês de uso, inclusive na assinatura anual. O saldo não acumula.")}</dd></div><div><dt>{t("E os meus conteúdos?")}</dt><dd>{t("Você sempre acessa seus próprios prompts. Ao reduzir o plano, as publicações existentes são preservadas; o limite vale para novas publicações.")}</dd></div><div><dt>{t("Arquivos e emblemas")}</dt><dd>{t("Markdowns e MCPs contam no limite de publicações. Os limites atuais de arquivo continuam iguais. Verificação de conta é independente da assinatura.")}</dd></div></dl></section>
 </main>;
}
