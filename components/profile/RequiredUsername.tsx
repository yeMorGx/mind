"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { ensureCreatorProfile } from "@/lib/firebase/publication";
import { claimUsername, getUsername, usernameErrorMessage } from "@/lib/supabase/creators";
import UsernameInput from "./UsernameInput";
export default function RequiredUsername({ onLogout }: { onLogout: () => Promise<void> }) {
  const { user, authReady, profileLoading } = useOnboarding();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [identity, setIdentity] = useState<{ uid: string; username: string | null; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void getUsername(uid).then(value => { if (alive) setIdentity({ uid, username: value ?? null, error: false }); }).catch(() => { if (alive) setIdentity({ uid, username: null, error: true }); });
    return () => { alive = false; };
  }, [uid, attempt]);
  useEffect(() => { const refresh = () => setAttempt(value => value + 1); window.addEventListener("mind:username", refresh); return () => window.removeEventListener("mind:username", refresh); }, []);
  const current = identity?.uid === uid ? identity : null;
  const blocked = Boolean(user && authReady && !profileLoading && !pathname.startsWith("/auth/") && current && (current.error || !current.username));
  useEffect(() => {
    const element = dialog.current; if (!element) return;
    if (blocked && !element.open) element.showModal();
    if (!blocked && element.open) element.close();
    if (!blocked) return;
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [blocked]);
  async function save() {
    if (!user || pending) return;
    setPending(true); setMessage("");
    try { await ensureCreatorProfile(user); const chosen = await claimUsername(user,username); setIdentity({ uid:user.uid,username:chosen,error:false }); }
    catch (error) { setMessage(usernameErrorMessage(error)); }
    finally { setPending(false); }
  }
  return <dialog ref={dialog} className="username-required-dialog" aria-labelledby="required-username-title" aria-describedby="required-username-description" onCancel={event => event.preventDefault()}>
    <h2 id="required-username-title" className="text-2xl font-semibold tracking-tight">Escolha seu @</h2>
    <p id="required-username-description" className="mt-3 text-sm leading-6 text-muted">Todo criador precisa de um @ único. Escolha o seu para continuar e permitir que outras pessoas encontrem seu perfil.</p>
    {!current ? <p role="status" className="my-8 text-sm text-muted">Conferindo seu perfil…</p> : current.error ? <div className="my-6"><p role="alert" className="text-sm text-red-700">Não foi possível consultar seu @.</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-4 rounded-xl border border-border px-4 py-2 text-sm">Tentar novamente</button></div> : <form className="mt-6" onSubmit={event => { event.preventDefault(); void save(); }}>
      <UsernameInput key={user?.uid} value={username} onChange={value => { setUsername(value); setMessage(""); }} publicId={user?.uid ?? ""} disabled={pending} autoFocus />
      {message && <p role="alert" className="mt-3 text-sm leading-6 text-red-700">{message}</p>}
      <button type="submit" disabled={pending} className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? "Salvando…" : "Confirmar @ e continuar"}</button>
    </form>}
    <button type="button" disabled={pending} onClick={() => void onLogout()} className="mt-4 w-full rounded-lg py-2 text-sm text-muted underline underline-offset-4 disabled:opacity-50">Sair da conta</button>
  </dialog>;
}
