"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Gauge, Infinity as InfinityIcon } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import type { MindUser } from "@/lib/backend";
import { billingRequest } from "@/lib/billing/client";
import { PLANS, type BillingStatus } from "@/lib/billing/plans";
import "./usage-badge.css";
export type UsageBadgeState = { kind: "loading" | "open" | "error" } | { kind: "ready"; status: BillingStatus };

export function UsageBadgeView({ state }: { state: UsageBadgeState }) {
 const status = state.kind === "ready" ? state.status : null;
 const exhausted = Boolean(status && status.limit !== null && status.remaining === 0);
 const label = state.kind === "loading" ? "Conferindo seu uso…" : state.kind === "error" ? "Uso indisponível. Abra sua assinatura para atualizar." : state.kind === "open" ? "Uso livre. Os limites de assinatura ainda não estão ativos." : status?.limit === null ? `${PLANS[status.plan].name}: desbloqueios ilimitados.` : `${PLANS[status!.plan].name}: ${status!.used} de ${status!.limit} desbloqueios usados; ${status!.remaining} disponíveis. Renova em ${new Date(status!.resetsAt).toLocaleString("pt-BR")}. Prompts já desbloqueados não gastam outro crédito.`;
 return <Link href="/home/billing" className="header-usage-badge" data-exhausted={exhausted || undefined} title={label} aria-label={label}>
  <Gauge size={15} aria-hidden="true"/>
  <span className="header-usage-label">Uso</span>
  <span className="header-usage-value">{state.kind === "loading" ? "…" : state.kind === "error" ? "—" : state.kind === "open" ? "livre" : status?.limit === null ? <><InfinityIcon size={17} aria-hidden="true"/><span className="sr-only">ilimitado</span></> : `${status!.used}/${status!.limit}`}</span>
 </Link>;
}

function AccountUsage({ user }: { user: MindUser }) {
 const pathname = usePathname();
 const [state, setState] = useState<UsageBadgeState>({ kind: "loading" });
 useEffect(() => {
  let alive = true, inFlight = false, queued = false;
  const visible = () => document.visibilityState !== "hidden";
  let timer: ReturnType<typeof setTimeout> | undefined;
  async function refresh() {
   if (!alive || !visible()) return;
   if (inFlight) { queued = true; return; }
   inFlight = true; clearTimeout(timer);
   let delay = 60000;
   try {
    const response = await fetch("/api/billing/config", { cache: "no-store" });
    if (!response.ok) throw new Error("Configuração indisponível");
    const config = await response.json();
    if (!alive) return;
    if (!config.enabled) setState({ kind: "open" });
    else {
     const status = await billingRequest<BillingStatus>(user, "status");
     if (!alive) return;
     setState(status.enabled ? { kind: "ready", status } : { kind: "open" });
     const reset = Date.parse(status.resetsAt) - Date.now() + 500;
     if (Number.isFinite(reset) && reset > 0) delay = Math.min(60000, Math.max(1000, reset));
    }
   } catch { if (alive) setState({ kind: "error" }); }
   finally {
    inFlight = false;
    if (alive && visible()) {
     if (queued) { queued = false; timer = setTimeout(() => void refresh(), 100); }
     else timer = setTimeout(() => void refresh(), delay);
    }
   }
  }
  const update = () => { if (!visible()) clearTimeout(timer); else void refresh(); };
  void refresh();
  window.addEventListener("mind:billing-usage", update);
  window.addEventListener("focus", update);
  document.addEventListener("visibilitychange", update);
  return () => { alive = false; clearTimeout(timer); window.removeEventListener("mind:billing-usage", update); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
 }, [user, pathname]);
 return <UsageBadgeView state={state}/>;
}
export default function UsageBadge() {
 const { user, authReady } = useOnboarding();
 return user && authReady ? <AccountUsage key={`${user.uid}:${user.backend ?? "firebase"}`} user={user}/> : null;
}
