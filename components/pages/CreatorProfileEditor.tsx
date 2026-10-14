"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { preparePromptImage } from "@/lib/prompt-media";
import CreatorBadges from "@/components/ui/CreatorBadges";
import { downloadOwnFirebaseBackup } from "@/lib/firebase/backup";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { startAccountMigration } from "@/lib/supabase/mind";
import { ensureCreatorProfile, getOwnProfile, saveCreatorProfile, profileSaveErrorMessage, type CreatorProfile } from "@/lib/firebase/publication";

export default function CreatorProfileEditor({ onSaved, onClose }: { onSaved: (profile: CreatorProfile) => void; onClose: () => void }) {
  const { user, authReady, profileLoading, data } = useOnboarding();
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loadedUid, setLoadedUid] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [adminUid, setAdminUid] = useState("");
  useEffect(() => {
    let alive = true;
    user?.getIdTokenResult().then(token => { if (alive) setAdminUid(token.claims.badgeAdmin === true ? user.uid : ""); }).catch(() => {});
    return () => { alive = false; };
  }, [user]);
  useEffect(() => {
    if (authReady && !user) router.replace("/");
    if (!user || profileLoading) return;
    let alive = true;
    ensureCreatorProfile(user).catch(error => { if (alive) setMessage(profileSaveErrorMessage(error)); }).then(() => getOwnProfile(user.uid)).then(value => { if (alive) { setProfile(value ?? { name: data.name || user.displayName || "", bio: "", avatarUrl: user.photoURL || "", bannerUrl: "", headline: "" }); setLoadedUid(user.uid); } })
      .catch(error => { if (alive) setMessage(profileSaveErrorMessage(error)); });
    return () => { alive = false; };
  }, [user, authReady, profileLoading, data.name, router]);
  async function upload(file: File | undefined, field: "avatarUrl" | "bannerUrl") {
    if (!file || !profile || pending) return;
    setPending(true); setMessage("");
    try { const image = await preparePromptImage(file); setProfile(current => current ? { ...current, [field]: image.url } : current); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível preparar a imagem."); }
    finally { setPending(false); }
  }
  async function save() {
    if (!user || loadedUid !== user.uid || !profile || pending) return;
    setPending(true); setMessage("");
    try {
      await saveCreatorProfile(user.uid, profile);
      onSaved(profile);
    }
    catch (error) {
      setMessage(profileSaveErrorMessage(error));
    }
    finally { setPending(false); }
  }
  async function backup() {
    if (!user || pending) return;
    setPending(true); setMessage("");
    try { const count = await downloadOwnFirebaseBackup(); setMessage(`Backup baixado com perfil, biblioteca e ${count} ${count === 1 ? "prompt" : "prompts"}.`); }
    catch { setMessage("Não foi possível baixar o backup. Confira sua conexão e tente novamente."); }
    finally { setPending(false); }
  }
  async function migrate() {
    if (!user || pending) return;
    setPending(true); setMessage("");
    try { await startAccountMigration(user); }
    catch { setMessage("Não foi possível abrir o login Google. Tente novamente."); setPending(false); }
  }
  return <section id="editar-perfil" aria-labelledby="edit-profile-heading" className="profile-editor mt-8 border-y border-black/10 py-8 text-[#17181a]">
    <div className="flex items-center justify-between gap-4"><h2 id="edit-profile-heading" tabIndex={-1} className="text-2xl font-semibold">Editar perfil</h2><button type="button" disabled={pending} onClick={onClose} className="rounded-full border border-black/20 px-4 py-2 text-sm disabled:opacity-40">Cancelar</button></div>
    {user && adminUid === user.uid && <Link href="/home/badges" className="mt-3 inline-block text-sm text-[#50505a] underline">Gerenciar emblemas da comunidade</Link>}
    <p className="mt-3 text-sm leading-6 text-[#50505a]">Seu perfil é sempre público. Escolha na biblioteca quais prompts aparecem nele.</p>
    {profile && loadedUid === user?.uid ? <form className="mt-8" onSubmit={event => { event.preventDefault(); void save(); }}><fieldset disabled={pending} className="space-y-6">
      <label className="block text-sm">Nome público<input required maxLength={80} value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} className="mt-2 block w-full rounded-xl border border-black/20 bg-white p-3" /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        {([ ["avatarUrl", "Foto do perfil"], ["bannerUrl", "Capa do perfil"] ] as const).map(([field, label]) => <label key={field} className="block text-sm">{label}
          {profile[field] && <div className="mt-2 flex items-start justify-between gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- Optimized local profile uploads. */}
            <img src={profile[field]} alt={label} className={`h-24 object-cover ${field === "avatarUrl" ? "w-24 rounded-2xl" : "w-44 rounded-xl"}`} />
            <button type="button" disabled={pending} onClick={() => setProfile({ ...profile, [field]: "" })} className="text-xs text-[#50505a] hover:text-black">Remover</button>
          </div>}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={event => { void upload(event.target.files?.[0], field); event.target.value = ""; }} className="mt-3 block w-full text-xs text-[#50505a] file:mr-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-black" />
        </label>)}
      </div>
      <p className="text-xs text-[#62626d]">JPEG, PNG ou WebP, até 5 MB. As imagens são otimizadas antes de salvar.</p>
      <label className="block text-sm">O que você cria<input maxLength={100} placeholder="Ex.: Criador de conteúdo sobre IA" value={profile.headline || ""} onChange={event => setProfile({ ...profile, headline: event.target.value })} className="mt-2 block w-full rounded-xl border border-black/20 bg-white p-3" /></label>
      {Boolean(profile.badges?.length) && <div><p className="mb-2 text-sm text-[#50505a]">Seus emblemas</p><CreatorBadges badges={profile.badges} labeled /></div>}
      <label className="block text-sm">Sobre você<textarea maxLength={1000} rows={5} value={profile.bio} onChange={event => setProfile({ ...profile, bio: event.target.value })} className="mt-2 block w-full rounded-xl border border-black/20 bg-white p-3" /></label>
      <p className="text-sm text-[#50505a]">Seu e-mail e os prompts privados não aparecem no perfil.</p>
      <button disabled={pending} type="submit" className="rounded-xl bg-[#17181a] px-5 py-3 font-medium text-white disabled:opacity-40">{pending ? "Salvando…" : "Salvar perfil"}</button>

    </fieldset></form> : !message && <p className="mt-8" role="status">Carregando perfil…</p>}
    {message && <p className="mt-5 text-sm text-[#50505a]" role="status">{message}</p>}
    {user && loadedUid === user.uid && <section className="mt-10 border-t border-black/10 pt-6">
      <h2 className="text-lg font-medium">Seus dados</h2>
      <p className="mt-2 text-sm leading-6 text-[#50505a]">Baixe uma cópia do perfil e dos prompts da sua biblioteca, incluindo as imagens salvas.</p>
      <button type="button" disabled={pending} onClick={() => void backup()} className="mt-4 rounded-xl border border-black/20 px-5 py-3 text-sm disabled:opacity-40">Baixar backup dos meus dados</button>
      {isSupabaseConfigured && user.backend !== "supabase" && <div className="mt-6">
        <p className="text-sm leading-6 text-[#50505a]">Depois que seu backup estiver autorizado, confirme a mesma conta Google para concluir a migração da biblioteca.</p>
        <button type="button" disabled={pending} onClick={() => void migrate()} className="mt-3 rounded-xl bg-[#17181a] px-5 py-3 text-sm font-medium text-white disabled:opacity-40">Concluir migração com Google</button>
      </div>}
      {user.backend === "supabase" && <p className="mt-4 text-sm text-[#50505a]">Sua conta e biblioteca já estão no Supabase.</p>}
    </section>}
  </section>;
}
