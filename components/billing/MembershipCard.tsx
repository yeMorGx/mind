"use client";
import { Infinity as InfinityIcon } from "lucide-react";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import ReflectiveCard from "@/components/effects/ReflectiveCard";
import Logo from "@/components/ui/logo";
import { PLANS, type BillingStatus } from "@/lib/billing/plans";
import { useCardTheme } from "./PlanPixelCard";
import "./membership-card.css";

export default function MembershipCard({ status, name }: { status: BillingStatus; name: string }) {
 const { t, intlLocale } = useI18n();
 const theme = useCardTheme();
 const pending = ["past_due", "unpaid", "incomplete", "paused"].includes(status.status);
 const stateLabel = !status.enabled ? t("Em preparação") : pending ? t("Pagamento pendente") : status.plan === "free" ? t("Free") : status.cancelAtPeriodEnd ? t("Até {v0}", { v0: status.periodEnd ? new Date(status.periodEnd).toLocaleDateString(intlLocale) : "—" }) : t("Ativo");
 return <section className="membership-card-region" aria-label={t("Seu cartão de assinatura Mind")}>
  <ReflectiveCard theme={theme} width="100%" height="auto" radius={22} className="mind-membership-card" webcam={false} metalness={0.85} roughness={0.45} shine={0.7} glare={0.22} tiltStrength={7} intro>
   <div className="membership-card-top"><span className="membership-card-brand"><Logo viewBox="245 205 535 580"/><span>Mind</span></span><span className="membership-card-status" data-pending={pending || undefined}><i aria-hidden="true"/>{stateLabel}</span></div>
   <div className="membership-card-plan"><h2>{PLANS[status.plan].name}</h2><span>{t("Assinatura Mind")}</span></div>
   <div className="membership-card-bottom"><div className="membership-card-holder"><span>{t("Titular")}</span><strong>{name}</strong></div><div className="membership-card-allowance"><span>{t("Cópias")}</span><strong>{status.limit === null ? <><InfinityIcon size={25} aria-hidden="true"/><span className="sr-only">{t("Ilimitados")}</span></> : t("{v0} disponíveis", {v0: status.remaining ?? 0})}</strong></div></div>
  </ReflectiveCard>
 </section>;
}
