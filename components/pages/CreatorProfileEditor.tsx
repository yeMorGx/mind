"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { preparePromptImage } from "@/lib/prompt-media";
import ProfileEditorForm from "@/components/profile/ProfileEditorForm";
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
      window.dispatchEvent(new Event("mind:username"));
      onSaved(profile);
    }
    catch (error) {
      setMessage(profileSaveErrorMessage(error));
    }
    finally { setPending(false); }
  }
  return <section id="editar-perfil" aria-labelledby="edit-profile-heading" className="profile-editor-v2">
    {profile && loadedUid === user?.uid ? <ProfileEditorForm profile={profile} setProfile={setProfile} publicId={user.uid} pending={pending} message={message} onSave={()=>void save()} onClose={onClose} onUpload={(file,field)=>void upload(file,field)}/> : <div className="p-8"><h2 id="edit-profile-heading">Editar perfil</h2><p role="status" className="mt-4 text-muted">{message||"Carregando perfil…"}</p><button type="button" onClick={onClose} className="workflow-button secondary mt-5">Fechar</button></div>}
    {user && adminUid === user.uid && <div className="profile-editor-admin"><Link href="/home/badges">Gerenciar emblemas da comunidade</Link></div>}
  </section>;
}
