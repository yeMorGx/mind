"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { uploadProfileImage, validateProfileFile, type ProfileCrop, type ProfileImageField } from "@/lib/profile-media";
import ProfileImageCropper from "@/components/profile/ProfileImageCropper";
import { billingRequest } from "@/lib/billing/client";
import type { BillingStatus } from "@/lib/billing/plans";
import ProfileEditorForm from "@/components/profile/ProfileEditorForm";
import { ensureCreatorProfile, getOwnProfile, saveCreatorProfile, profileSaveErrorMessage, type CreatorProfile } from "@/lib/firebase/publication";

export default function CreatorProfileEditor({ onSaved, onClose }: { onSaved: (profile: CreatorProfile) => void; onClose: () => void }) {
 const { t } = useI18n();

  const { user, authReady, profileLoading, data } = useOnboarding();
  const router = useRouter();
  const [cropImage, setCropImage] = useState<{file:File;field:ProfileImageField;source:string}|null>(null);
  const [gifAllowed, setGifAllowed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loadedUid, setLoadedUid] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [adminUid, setAdminUid] = useState("");
  useEffect(() => {
    let alive = true;
    if(user)void billingRequest<BillingStatus>(user,"status").then(status=>{if(alive)setGifAllowed(status.enabled && ["plus","premium"].includes(status.plan));}).catch(()=>{});
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
  }, [user, authReady, profileLoading, data.name, router, loadAttempt]);
  useEffect(()=>()=>{if(cropImage)URL.revokeObjectURL(cropImage.source);},[cropImage]);
  async function upload(file: File | undefined, field: ProfileImageField) {
    if (!file || !profile || pending) return;
    setMessage("");
    let source="";
    setPending(true);
    try {
      validateProfileFile(file);
      if (file.type === "image/gif" && !gifAllowed) throw new Error(t("GIFs estão disponíveis nos planos Plus e Premium."));
      source=URL.createObjectURL(file);
      const image=new Image();image.src=source;await image.decode();
      if(image.naturalWidth*image.naturalHeight>40000000)throw new Error(t("Esta imagem tem resolução muito alta. Reduza-a antes de adicionar."));
      setCropImage({file,field,source});
    } catch (error) { if(source)URL.revokeObjectURL(source);setMessage(error instanceof Error && !(error instanceof DOMException) ? error.message : t("Não foi possível preparar a imagem.")); }
    finally {setPending(false);}
  }
  async function applyCrop(crop: ProfileCrop) {
    if(!user || !cropImage || pending)return;
    setPending(true);setMessage("");
    try {
      const url=await uploadProfileImage(user,cropImage.file,cropImage.field,crop);
      setProfile(current=>current?{...current,[cropImage.field]:url}:current);
      setCropImage(null);
    } catch(error) {setMessage(error instanceof Error?error.message:t("Não foi possível preparar a imagem."));}
    finally {setPending(false);}
  }
  async function save() {
    if (!user || loadedUid !== user.uid || !profile || pending) return;
    setPending(true); setMessage("");
    try {
      await saveCreatorProfile(user.uid, profile);
      window.dispatchEvent(new Event("mind:username"));
      onSaved(profile);
      window.dispatchEvent(new Event("mind:profile"));
    }
    catch (error) {
      setMessage(profileSaveErrorMessage(error));
    }
    finally { setPending(false); }
  }
  return <section id="editar-perfil" aria-labelledby="edit-profile-heading" className="profile-editor-v2">
    {profile && loadedUid === user?.uid ? <ProfileEditorForm profile={profile} setProfile={setProfile} publicId={user.uid} pending={pending} message={t(message)} onSave={()=>void save()} onClose={onClose} onUpload={upload} gifAllowed={gifAllowed}/> : <div className="p-8"><h2 id="edit-profile-heading">{t("Editar perfil")}</h2><p role="status" className="mt-4 text-muted">{message?t(message):t("Carregando perfil…")}</p><button type="button" onClick={()=>{setMessage("");setLoadAttempt(value=>value+1);}} className="workflow-button secondary mt-5">{t("Tentar novamente")}</button><button type="button" onClick={onClose} className="workflow-button secondary mt-5">{t("Fechar")}</button></div>}
    {cropImage&&<ProfileImageCropper source={cropImage.source} field={cropImage.field} pending={pending} error={message} onCancel={()=>{if(!pending){setCropImage(null);setMessage("");}}} onApply={crop=>void applyCrop(crop)}/>}
    {user && adminUid === user.uid && <div className="profile-editor-admin"><Link href="/home/badges">{t("Gerenciar emblemas da comunidade")}</Link></div>}
  </section>;
}
