"use client";
import {useId,useRef,type Dispatch,type SetStateAction} from "react";
import {Camera,ImagePlus,Upload,X} from "lucide-react";
import UsernameInput from "./UsernameInput";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type {CreatorProfile} from "@/lib/firebase/publication";
export default function ProfileEditorForm({profile,setProfile,publicId,pending,message,onSave,onClose,onUpload}:{profile:CreatorProfile;setProfile:Dispatch<SetStateAction<CreatorProfile|null>>;publicId:string;pending:boolean;message:string;onSave:()=>void;onClose:()=>void;onUpload:(file:File|undefined,field:"avatarUrl"|"bannerUrl")=>void}){
 const id=useId(),avatar=useRef<HTMLInputElement>(null),banner=useRef<HTMLInputElement>(null);
 function change(values:Partial<CreatorProfile>){setProfile(current=>current?{...current,...values}:current);}
 return <form className="profile-form" onSubmit={event=>{event.preventDefault();onSave();}}>
  <div className="profile-form-heading"><div><h2 id="edit-profile-heading" tabIndex={-1}>Editar perfil</h2><p>Mostre quem cria por trás dos seus prompts.</p></div><button type="button" disabled={pending} onClick={onClose} aria-label="Fechar edição do perfil" className="site-icon-button"><X size={20}/></button></div>
  <fieldset disabled={pending} className="profile-form-content">
   <section className="profile-form-appearance" aria-labelledby={`${id}-appearance`}><div className="profile-form-section-heading"><h3 id={`${id}-appearance`}>Sua identidade visual</h3><p>Foto e capa aparecem no seu perfil público.</p></div>
    <div className="profile-form-banner">{profile.bannerUrl?
     // eslint-disable-next-line @next/next/no-img-element -- Optimized profile upload.
     <img src={profile.bannerUrl} alt="Prévia da capa do perfil"/>:<span><ImagePlus size={28}/>Uma capa para o seu espaço criativo</span>}
     <button type="button" className="profile-image-action" onClick={()=>banner.current?.click()}><Upload size={15}/>{profile.bannerUrl?"Alterar capa":"Adicionar capa"}</button>
    </div>
    <div className="profile-form-avatar-row"><div className="profile-form-avatar">{profile.avatarUrl?
     // eslint-disable-next-line @next/next/no-img-element -- Optimized profile upload.
     <img src={profile.avatarUrl} alt="Prévia da foto do perfil"/>:<span>{Array.from(profile.name.trim())[0]?.toUpperCase()||"M"}</span>}<button type="button" aria-label="Alterar foto do perfil" onClick={()=>avatar.current?.click()}><Camera size={16}/></button></div><div><button className="profile-text-action" type="button" onClick={()=>avatar.current?.click()}>{profile.avatarUrl?"Alterar foto":"Adicionar foto"}</button><p>JPEG, PNG ou WebP · até 5 MB</p></div></div>
    <div className="profile-image-removals">{profile.avatarUrl&&<button type="button" onClick={()=>change({avatarUrl:""})}>Remover foto</button>}{profile.bannerUrl&&<button type="button" onClick={()=>change({bannerUrl:""})}>Remover capa</button>}</div>
    <input ref={avatar} type="file" className="sr-only" tabIndex={-1} accept="image/jpeg,image/png,image/webp" aria-label="Enviar foto do perfil" onChange={event=>{onUpload(event.target.files?.[0],"avatarUrl");event.target.value="";}}/>
    <input ref={banner} type="file" className="sr-only" tabIndex={-1} accept="image/jpeg,image/png,image/webp" aria-label="Enviar capa do perfil" onChange={event=>{onUpload(event.target.files?.[0],"bannerUrl");event.target.value="";}}/>
    {Boolean(profile.badges?.length)&&<div className="profile-form-badges"><h4>Seus emblemas</h4><CreatorBadges badges={profile.badges} labeled/><p>Emblemas são atribuídos pela equipe Mind.</p></div>}
   </section>
   <section className="profile-form-details" aria-labelledby={`${id}-details`}><div className="profile-form-section-heading"><h3 id={`${id}-details`}>Informações públicas</h3><p>Seu e-mail e seus prompts privados não aparecem aqui.</p></div><div className="profile-form-fields"><label>Nome público<input required maxLength={80} value={profile.name} onChange={event=>change({name:event.target.value})} autoComplete="name"/></label><UsernameInput value={profile.username||""} onChange={username=>change({username})} publicId={publicId} disabled={pending}/><label>O que você cria<input maxLength={100} placeholder="Ex.: Crio imagens e vídeos com IA" value={profile.headline||""} onChange={event=>change({headline:event.target.value})}/></label><label>Sobre você<textarea rows={4} maxLength={1000} placeholder="Conte sobre seu trabalho e o que as pessoas encontram nos seus prompts." value={profile.bio} onChange={event=>change({bio:event.target.value})}/><span className="profile-form-count">{profile.bio.length}/1.000</span></label></div></section>
  </fieldset>
  <footer className="profile-form-footer"><p role="status">{message||(pending?"Preparando suas alterações…":"Seu perfil é público. Seus prompts só aparecem quando publicados.")}</p><div><button type="button" className="workflow-button secondary" disabled={pending} onClick={onClose}>Cancelar</button><button type="submit" className="workflow-button" disabled={pending}>{pending?"Salvando…":"Salvar perfil"}</button></div></footer>
 </form>;
}
