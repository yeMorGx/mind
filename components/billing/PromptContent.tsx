"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, LockKeyhole } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { billingRequest } from "@/lib/billing/client";
import type { Entitlement } from "@/lib/billing/plans";
import PromptUseAI from "@/components/prompts/PromptUseAI";
import ScrollShadow from "@/components/ui/ScrollShadow";
import "./billing.css";
type Props = { content: string; creatorId: string; promptId: string; locked: boolean; hasImages: boolean; isPrivate: boolean };
function ContentSession({ content, creatorId, promptId, locked, hasImages, isPrivate }: Props) {
 const { t, intlLocale } = useI18n();

 const { user } = useOnboarding(); const { requestLogin } = useSiteLayout();
 const [entitlement, setEntitlement] = useState<Entitlement | null>(null), [checking, setChecking] = useState(locked && !!user), [busy, setBusy] = useState(false), [error, setError] = useState(""), [copied, setCopied] = useState(false);
 const copying = useRef(false);
 const value = locked ? entitlement?.unlocked ? entitlement.content ?? null : null : content;
 useEffect(() => {
  if (!locked || !user) return;
  let alive = true;
  void billingRequest<Entitlement>(user, "prompt", { creatorId, promptId }).then(result => { if (alive) setEntitlement(result); }).catch(failure => { if (alive) setError(failure instanceof Error ? failure.message : "Não foi possível conferir seu acesso."); }).finally(() => { if (alive) setChecking(false); });
  return () => { alive = false; };
 }, [locked, user, creatorId, promptId]);
 async function unlock() {
  if (!user) { requestLogin(); return; }
  if (busy) return; setBusy(true); setError("");
  try { setEntitlement(await billingRequest<Entitlement>(user, "unlock", { creatorId, promptId })); }
  catch (failure) { setError(failure instanceof Error ? failure.message : t("Não foi possível desbloquear.")); }
  finally { setBusy(false); }
 }
 async function prepareCopy(): Promise<string> {
  if (value === null || copying.current) throw new Error(t("Aguarde a cópia atual terminar."));
  if (isPrivate) return value;
  if (!user) { requestLogin(); throw new Error(t("Entre para copiar este prompt.")); }
  copying.current = true; setBusy(true); setError("");
  try {
   const result = await billingRequest<Entitlement>(user, "copy", { creatorId, promptId, requestId: crypto.randomUUID() });
   setEntitlement(result);
   if (result.limitReached) throw new Error(t("Você usou as cópias disponíveis. Escolha um plano ou aguarde a renovação."));
   if (!result.unlocked || !result.content) throw new Error(t("Não foi possível carregar o conteúdo."));
   return result.content;
  } catch (failure) {
   const message = failure instanceof Error ? failure.message : t("Não foi possível copiar o prompt.");
   setError(message); throw new Error(message);
  } finally { copying.current = false; setBusy(false); }
 }
 async function copy() {
  if (value === null || copying.current) return;
  try { const text = await prepareCopy(); await navigator.clipboard.writeText(text); setCopied(true); setError(""); }
  catch (failure) { setError(failure instanceof Error ? failure.message : t("Não foi possível copiar o prompt.")); }
 }

 return <>
  <div className="prompt-detail-section-heading"><h2 id="prompt-text-heading">{t("O prompt")}</h2>{value !== null && <div className="prompt-detail-action-group"><button type="button" className="workflow-button secondary" disabled={busy} onClick={() => void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? t("Copiado") : t("Copiar prompt")}</button><PromptUseAI content={value} hasImages={hasImages} beforeUse={prepareCopy} disabled={busy}/></div>}</div>
  {value !== null ? <><ScrollShadow label={t("Texto completo do prompt")} className="prompt-text-scroll"><pre>{value}</pre></ScrollShadow><p className="prompt-detail-copy-note">{isPrivate ? t("Seu prompt na biblioteca. Só você tem acesso a esta página.") : t("Cada cópia gasta um uso, mesmo do mesmo prompt.")}</p></> : <div className="prompt-unlock-panel">
   <LockKeyhole size={23} aria-hidden="true"/><h3>{t("Leve este prompt para a sua próxima criação.")}</h3>
   <p>{checking ? t("Conferindo seu acesso…") : entitlement?.limitReached ? t("Você usou as cópias disponíveis. Escolha um plano ou aguarde a renovação.") : t("O Free inclui duas cópias por dia. Abrir o prompt não gasta um uso.")}</p>
   {entitlement && <p className="billing-balance">{entitlement.billing.remaining === null ? t("Cópias ilimitadas") : t("{v0} cópias disponíveis", {v0: (entitlement.billing.remaining)})}{entitlement.billing.remaining !== null && <> {t("· Renova em")}{" "}{new Date(entitlement.billing.resetsAt).toLocaleString(intlLocale)}</>}</p>}
   <div className="resource-actions">{!entitlement?.limitReached && <button type="button" className="workflow-button" disabled={busy || checking} onClick={() => void unlock()}>{busy ? t("Desbloqueando…") : user ? t("Desbloquear prompt") : t("Entrar para desbloquear")}</button>}<Link href="/plans" className="workflow-button secondary">{t("Conhecer os planos")}</Link></div>
  </div>}
  {error && <p role="alert" className="billing-error">{t(error)}</p>}
  <span role="status" className="sr-only">{copied ? t("Prompt copiado.") : entitlement?.unlocked ? t("Prompt desbloqueado.") : ""}</span>
 </>;
}
export default function PromptContent(props: Props) { const { user } = useOnboarding(); return <ContentSession key={`${user?.uid ?? "visitor"}:${props.creatorId}:${props.promptId}:${props.locked}`} {...props}/>; }
