"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,Download,LogOut} from "lucide-react";
import {useOnboarding} from "@/app/context/OnboardingContext";
import {useSiteLayout} from "@/components/layout/SiteLayout";
import {saveOnboardingProgress,type AccountPreferences} from "@/lib/firebase/data";
import {downloadOwnFirebaseBackup} from "@/lib/firebase/backup";
export default function SettingsPage(){
 const {user,authReady,profileLoading,data,updateData}=useOnboarding();
 const {requestLogin,signOut}=useSiteLayout();
 const [backupPending,setBackupPending]=useState(false),[backupMessage,setBackupMessage]=useState("");
 const [logoutPending,setLogoutPending]=useState(false);
 const backupBusy=useRef(false);
 if(!authReady||profileLoading)return <main className="workflow-page"><p role="status">Carregando configurações…</p></main>;
 if(!user)return <main className="workflow-page"><h1>Configurações da conta</h1><p className="workflow-intro">Entre na sua conta para acessar suas preferências.</p><button className="workflow-button mt-6" onClick={requestLogin}>Entrar</button></main>;
 async function download(){
  if(backupBusy.current)return;backupBusy.current=true;setBackupPending(true);setBackupMessage("");
  try{const count=await downloadOwnFirebaseBackup();setBackupMessage(`Download iniciado: perfil, biblioteca e ${count} ${count===1?"prompt":"prompts"}.`);}
  catch{setBackupMessage("Não foi possível baixar seus dados. Confira sua conexão e tente novamente.");}
  finally{backupBusy.current=false;setBackupPending(false);}
 }
 return <main className="workflow-page"><Link href="/home" className="workflow-back"><ArrowLeft size={16}/>Voltar à biblioteca</Link><h1>Configurações</h1><p className="workflow-intro">Sua conta e suas preferências de criação.</p>
 <section className="settings-section"><h2>Sua conta</h2><p><strong className="text-foreground">{data.name||user.displayName||"Sua conta"}</strong><br/>{user.email}</p><p>Nome, foto, capa e @ são editados no seu perfil público.</p><Link href={`/u/${encodeURIComponent(user.uid)}`} className="workflow-button secondary mt-5">Gerenciar perfil</Link></section>
 <PreferencesForm key={user.uid} initial={data.preferences} onSave={async preferences=>{await saveOnboardingProgress(user,{preferences});updateData({preferences});}}/>
 <section className="settings-section"><h2>Seus dados</h2><p>Baixe uma cópia do seu perfil e da biblioteca, incluindo seus prompts e imagens, em JSON.</p><button className="workflow-button secondary mt-5" disabled={backupPending} onClick={()=>void download()}><Download size={16}/>{backupPending?"Preparando download…":"Baixar meus dados"}</button><p role="status">{backupMessage}</p></section>
 <section className="settings-section border-0"><h2>Sessão</h2><p>Saia da sua conta neste navegador.</p><button className="workflow-button secondary mt-5" disabled={logoutPending} onClick={async()=>{setLogoutPending(true);await signOut();setLogoutPending(false);}}><LogOut size={16}/>{logoutPending?"Saindo…":"Sair da conta"}</button></section>
 </main>;
}
export function PreferencesForm({initial,onSave}:{initial?:AccountPreferences;onSave:(values:AccountPreferences)=>Promise<void>}){
 const [category,setCategory]=useState(initial?.defaultCategory??""),[model,setModel]=useState(initial?.defaultModel??""),[favoritesFirst,setFavoritesFirst]=useState(initial?.favoritesFirst??false);
 const [pending,setPending]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
 const busy=useRef(false);
 return <form className="settings-section" onSubmit={async event=>{event.preventDefault();if(busy.current)return;busy.current=true;setPending(true);setMessage("");setFailed(false);try{await onSave({defaultCategory:category.trim(),defaultModel:model.trim(),favoritesFirst});setMessage("Preferências salvas.");}catch{setFailed(true);setMessage("Não foi possível salvar. Confira sua conexão e tente novamente.");}finally{busy.current=false;setPending(false);}}}>
 <h2>Preferências da biblioteca</h2><p>Preencha novos prompts com seus padrões. Você pode mudar esses campos em cada prompt.</p><div className="settings-fields"><label>Categoria padrão<input maxLength={80} placeholder="Ex.: Retratos" value={category} disabled={pending} onChange={event=>setCategory(event.target.value)}/></label><label>Modelo / ferramenta padrão<input maxLength={80} placeholder="Ex.: Midjourney" value={model} disabled={pending} onChange={event=>setModel(event.target.value)}/></label></div>
 <label className="mt-6 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={favoritesFirst} disabled={pending} onChange={event=>setFavoritesFirst(event.target.checked)} className="size-4 accent-primary"/>Mostrar favoritos primeiro na biblioteca</label><button type="submit" disabled={pending} className="workflow-button mt-5">{pending?"Salvando…":"Salvar preferências"}</button><p role="status" className={failed?"!text-red-700":""}>{message}</p>
 </form>;
}
