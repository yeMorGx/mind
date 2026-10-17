"use client";
import { useEffect, useState } from "react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { billingRequest } from "@/lib/billing/client";
export default function PromptAccessSettings({ creatorId, promptId }: { creatorId: string; promptId: string }) {
 const { user } = useOnboarding();
 const [mode, setMode] = useState("metered"), [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
 useEffect(() => { if (!user || user.uid !== creatorId) return; let alive = true; void billingRequest<{ mode: string }>(user, "access-state", { promptId }).then(value => { if (alive) { setMode(value.mode); setReady(true); } }).catch(() => {}); return () => { alive = false; }; }, [user, creatorId, promptId]);
 if (!user || user.uid !== creatorId) return null;
 async function save(next: string) { if (!user || busy) return; setBusy(true); setNotice(""); try { await billingRequest(user, "access", { promptId, mode: next }); setMode(next); setNotice("Acesso atualizado."); } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setBusy(false); } }
 return <section className="prompt-detail-about"><h2>Acesso dos visitantes</h2><p className="text-sm leading-6 text-muted">Escolha se este prompt fica livre para todos ou participa dos desbloqueios dos planos.</p>{ready ? <label className="billing-access-choice"><input type="checkbox" checked={mode === "free"} disabled={busy} onChange={event => void save(event.target.checked ? "free" : "metered")}/>Livre para todos</label> : <p className="mt-3 text-sm text-muted">Esta opção estará disponível quando as assinaturas forem ativadas.</p>}<p role="status" className="mt-3 text-sm text-muted">{notice}</p></section>;
}
