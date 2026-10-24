"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {useId,useRef,type Dispatch,type SetStateAction} from "react";
import {Camera,ImagePlus,Upload,X} from "lucide-react";
import UsernameInput from "./UsernameInput";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type {CreatorProfile} from "@/lib/firebase/publication";
export default function ProfileEditorForm({profile,setProfile,publicId,pending,message,onSave,onClose,onUpload,gifAllowed=false}:{profile:CreatorProfile;setProfile:Dispatch<SetStateAction<CreatorProfile|null>>;publicId:string;pending:boolean;message:string;onSave:()=>void;onClose:()=>void;gifAllowed?:boolean;onUpload:(file:File|undefined,field:"avatarUrl"|"bannerUrl")=>void}){
 const { t } = useI18n();

 const id=useId(),avatar=useRef<HTMLInputElement>(null),banner=useRef<HTMLInputElement>(null);
 function change(values:Partial<CreatorProfile>){setProfile(current=>current?{...current,...values}:current);}
 return <form className="profile-form" onSubmit={event=>{event.preventDefault();onSave();}}>
  <div className="profile-form-heading"><div><h2 id="edit-profile-heading" tabIndex={-1}>{t("Editar perfil")}</h2><p>{t("Mostre quem cria por trás dos seus prompts.")}</p></div><button type="button" disabled={pending} onClick={onClose} aria-label={t("Fechar edição do perfil")} className="site-icon-button"><X size={20}/></button></div>
  <fieldset disabled={pending} className="profile-form-content">
   <section className="profile-form-appearance" aria-labelledby={`${id}-appearance`}><div className="profile-form-section-heading"><h3 id={`${id}-appearance`}>{t("Sua identidade visual")}</h3><p>{t("Foto e capa aparecem no seu perfil público.")}</p></div>
    <div className="profile-form-banner">{profile.bannerUrl?
     // eslint-disable-next-line @next/next/no-img-element -- Optimized profile upload.
     <img src={profile.bannerUrl} alt={t("Prévia da capa do perfil")}/>:<span><ImagePlus size={28}/>{t("Uma capa para o seu espaço criativo")}</span>}
     <button type="button" className="profile-image-action" onClick={()=>banner.current?.click()}><Upload size={15}/>{profile.bannerUrl?t("Alterar capa"):t("Adicionar capa")}</button>
    </div>
    <div className="profile-form-avatar-row"><div className="profile-form-avatar">{profile.avatarUrl?
     // eslint-disable-next-line @next/next/no-img-element -- Optimized profile upload.
     <img src={profile.avatarUrl} alt={t("Prévia da foto do perfil")}/>:<span>{Array.from(profile.name.trim())[0]?.toUpperCase()||t("M")}</span>}<button type="button" aria-label={t("Alterar foto do perfil")} onClick={()=>avatar.current?.click()}><Camera size={16}/></button></div><div><button className="profile-text-action" type="button" onClick={()=>avatar.current?.click()}>{profile.avatarUrl?t("Alterar foto"):t("Adicionar foto")}</button><p>{gifAllowed?t("JPEG, PNG e WebP até 12 MB · GIF até 4 MB"):t("JPEG, PNG e WebP até 12 MB · GIF no Plus e Premium")}</p></div></div>
    <div className="profile-image-removals">{profile.avatarUrl&&<button type="button" onClick={()=>change({avatarUrl:""})}>{t("Remover foto")}</button>}{profile.bannerUrl&&<button type="button" onClick={()=>change({bannerUrl:""})}>{t("Remover capa")}</button>}</div>
    <input ref={avatar} type="file" className="sr-only" tabIndex={-1} accept={gifAllowed?"image/jpeg,image/png,image/webp,image/gif":"image/jpeg,image/png,image/webp"} aria-label={t("Enviar foto do perfil")} onChange={event=>{onUpload(event.target.files?.[0],"avatarUrl");event.target.value="";}}/>
    <input ref={banner} type="file" className="sr-only" tabIndex={-1} accept={gifAllowed?"image/jpeg,image/png,image/webp,image/gif":"image/jpeg,image/png,image/webp"} aria-label={t("Enviar capa do perfil")} onChange={event=>{onUpload(event.target.files?.[0],"bannerUrl");event.target.value="";}}/>
    {Boolean(profile.badges?.length)&&<div className="profile-form-badges"><h4>{t("Seus emblemas")}</h4><CreatorBadges badges={profile.badges} labeled/><p>{t("Emblemas são atribuídos pela equipe Mind.")}</p></div>}
   </section>
   <section className="profile-form-details" aria-labelledby={`${id}-details`}><div className="profile-form-section-heading"><h3 id={`${id}-details`}>{t("Informações públicas")}</h3><p>{t("Seu e-mail e seus prompts privados não aparecem aqui.")}</p></div><div className="profile-form-fields"><label>{t("Nome público")}<input required maxLength={80} value={profile.name} onChange={event=>change({name:event.target.value})} autoComplete="name"/></label><UsernameInput value={profile.username||""} onChange={username=>change({username})} publicId={publicId} disabled={pending}/><label>{t("O que você cria")}<input maxLength={100} placeholder={t("Ex.: Crio imagens e vídeos com IA")} value={profile.headline||""} onChange={event=>change({headline:event.target.value})}/></label><label>{t("Sobre você")}<textarea rows={4} maxLength={1000} placeholder={t("Conte sobre seu trabalho e o que as pessoas encontram nos seus prompts.")} value={profile.bio} onChange={event=>change({bio:event.target.value})}/><span className="profile-form-count">{profile.bio.length}/1.000</span></label></div></section>
  </fieldset>
  <footer className="profile-form-footer"><p role="status">{message||(pending?t("Preparando suas alterações…"):t("Seu perfil é público. Seus prompts só aparecem quando publicados."))}</p><div><button type="button" className="workflow-button secondary" disabled={pending} onClick={onClose}>{t("Cancelar")}</button><button type="submit" className="workflow-button" disabled={pending}>{pending?t("Salvando…"):t("Salvar perfil")}</button></div></footer>
 </form>;
}
