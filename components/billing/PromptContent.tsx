"use client";
import { useEffect, useState } from "react";
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
 const { user } = useOnboarding(); const { requestLogin } = useSiteLayout();
 const [entitlement, setEntitlement] = useState<Entitlement | null>(null), [checking, setChecking] = useState(locked && !!user), [busy, setBusy] = useState(false), [error, setError] = useState(""), [copied, setCopied] = useState(false);
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
  catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível desbloquear."); }
  finally { setBusy(false); }
 }
 async function copy() {
  if (value === null) return;
  try { await navigator.clipboard.writeText(value); setCopied(true); setError(""); }
  catch { setError("Não foi possível copiar. Selecione o texto e copie manualmente."); }
 }
 return <>
  <div className="prompt-detail-section-heading"><h2 id="prompt-text-heading">O prompt</h2>{value !== null && <div className="prompt-detail-action-group"><button type="button" className="workflow-button secondary" onClick={() => void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Copiado" : "Copiar prompt"}</button><PromptUseAI content={value} hasImages={hasImages}/></div>}</div>
  {value !== null ? <><ScrollShadow label="Texto completo do prompt" className="prompt-text-scroll"><pre>{value}</pre></ScrollShadow><p className="prompt-detail-copy-note">{isPrivate ? "Seu prompt na biblioteca. Só você tem acesso a esta página." : locked ? "Desbloqueado na sua conta. Copiar novamente não gasta outro crédito." : "Livre para visualizar, copiar e experimentar."}</p></> : <div className="prompt-unlock-panel">
   <LockKeyhole size={23} aria-hidden="true"/><h3>Leve este prompt para a sua próxima criação.</h3>
   <p>{checking ? "Conferindo seu acesso…" : entitlement?.limitReached ? "Você usou os desbloqueios disponíveis neste período. Escolha um plano ou aguarde a renovação." : "Desbloqueie uma vez e volte para copiar sempre que precisar. O Free inclui dois novos prompts por dia."}</p>
   {entitlement && <p className="billing-balance">{entitlement.billing.remaining === null ? "Desbloqueios ilimitados" : `${entitlement.billing.remaining} desbloqueios disponíveis`}{entitlement.billing.remaining !== null && <> · Renova em {new Date(entitlement.billing.resetsAt).toLocaleString("pt-BR")}</>}</p>}
   <div className="resource-actions">{!entitlement?.limitReached && <button type="button" className="workflow-button" disabled={busy || checking} onClick={() => void unlock()}>{busy ? "Desbloqueando…" : user ? "Desbloquear prompt" : "Entrar para desbloquear"}</button>}<Link href="/plans" className="workflow-button secondary">Conhecer os planos</Link></div>
  </div>}
  {error && <p role="alert" className="billing-error">{error}</p>}
  <span role="status" className="sr-only">{copied ? "Prompt copiado." : entitlement?.unlocked ? "Prompt desbloqueado." : ""}</span>
 </>;
}
export default function PromptContent(props: Props) { const { user } = useOnboarding(); return <ContentSession key={`${user?.uid ?? "visitor"}:${props.creatorId}:${props.promptId}:${props.locked}`} {...props}/>; }
