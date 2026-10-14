"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { getOwnProfile, saveCreatorProfile, type CreatorProfile } from "@/lib/firebase/publication";

export default function CreatorProfileEditor() {
  const { user, authReady, profileLoading, data } = useOnboarding();
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loadedUid, setLoadedUid] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (authReady && !user) router.replace("/");
    if (!user || profileLoading) return;
    let alive = true;
    getOwnProfile(user.uid).then(value => { if (alive) { setProfile(value ?? { name: data.name || user.displayName || "", bio: "", published: false }); setLoadedUid(user.uid); } })
      .catch(() => { if (alive) setMessage("Não foi possível carregar o perfil. Recarregue a página."); });
    return () => { alive = false; };
  }, [user, authReady, profileLoading, data.name, router]);
  async function save(published: boolean) {
    if (!user || loadedUid !== user.uid || !profile || pending) return;
    setPending(true); setMessage("");
    try { await saveCreatorProfile(user.uid, { ...profile, published }); setProfile({ ...profile, published }); setMessage(published ? "Perfil publicado. Escolha os prompts que deseja divulgar na biblioteca." : "Perfil privado salvo."); }
    catch (error) { setMessage(error instanceof Error && error.message.startsWith("Informe") ? error.message : "Não foi possível salvar o perfil. Tente novamente."); }
    finally { setPending(false); }
  }
  return <main className="min-h-screen bg-background px-5 py-12 text-foreground"><div className="mx-auto max-w-2xl">
    <Link href="/home" className="text-sm text-white/60">← Voltar à biblioteca</Link>
    <h1 className="mt-8 text-3xl font-semibold">Seu perfil de criador</h1>
    <p className="mt-3 text-sm leading-6 text-white/55">Seu perfil começa privado. Publique quando estiver pronto e escolha separadamente quais prompts aparecem nele.</p>
    {profile && loadedUid === user?.uid ? <form className="mt-8 space-y-6" onSubmit={event => { event.preventDefault(); void save(profile.published); }}>
      <label className="block text-sm">Nome público<input required maxLength={80} value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} className="mt-2 block w-full rounded-xl border border-white/15 bg-white/5 p-3" /></label>
      <label className="block text-sm">Sobre você<textarea maxLength={1000} rows={5} value={profile.bio} onChange={event => setProfile({ ...profile, bio: event.target.value })} className="mt-2 block w-full rounded-xl border border-white/15 bg-white/5 p-3" /></label>
      <p className="text-sm text-white/60">{profile.published ? "Perfil público" : "Perfil privado"} · Seu e-mail e os prompts privados não aparecem no perfil.</p>
      {profile.published && <p className="text-sm text-white/50">Tornar o perfil privado também oculta seus prompts publicados. Você pode publicar o perfil novamente quando quiser.</p>}
      <div className="flex flex-wrap gap-3"><button disabled={pending} type="submit" className="rounded-xl border border-white/20 px-5 py-3 disabled:opacity-40">{pending ? "Salvando…" : "Salvar perfil"}</button>
        <button disabled={pending} type="button" onClick={() => void save(!profile.published)} className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-40">{profile.published ? "Tornar perfil privado" : "Publicar perfil"}</button></div>
      {profile.published && user && <div className="flex flex-wrap gap-4 text-sm"><Link href={`/u/${user.uid}`} className="underline">Ver perfil público</Link><button type="button" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/u/${user.uid}`).then(() => setMessage("Link do perfil copiado.")).catch(() => setMessage("Não foi possível copiar o link."))} className="underline">Copiar link do perfil</button></div>}
    </form> : !message && <p className="mt-8" role="status">Carregando perfil…</p>}
    {message && <p className="mt-5 text-sm text-white/70" role="status">{message}</p>}
  </div></main>;
}
