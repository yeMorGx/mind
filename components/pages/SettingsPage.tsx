"use client";
import Connections from "@/components/settings/Connections";
import MFASettings from "@/components/settings/MFASettings";
import {startAccountMigration} from "@/lib/supabase/mind";
import AIModelPicker from "@/components/models/AIModelPicker";
import {useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {ArrowLeft,Download,LogOut,Link2,ShieldCheck,SlidersHorizontal,Database} from "lucide-react";
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
 return <SettingsFrame>
 <section id="connections" className="account-settings-section"><div className="account-settings-section-intro"><Link2 size={21}/><h2>Contas conectadas</h2><p>Escolha as contas que você usa para entrar no Mind.</p></div><div className="account-settings-section-body">{user.backend==="supabase"?<Connections/>:<p>Entre novamente com Google para gerenciar as conexões desta conta.</p>}</div></section>
 <section id="security" className="account-settings-section"><div className="account-settings-section-intro"><ShieldCheck size={21}/><h2>Segurança e acesso</h2><p>Adicione uma etapa de proteção ao seu login.</p></div><div className="account-settings-section-body"><div className="settings-account-email"><span>E-mail da conta</span><strong>{user.email}</strong><p>O e-mail é gerenciado pelo provedor conectado.</p></div>{user.backend==="supabase"?<MFASettings/>:<p className="mt-5 text-sm text-muted">Use o login Google atualizado para configurar o autenticador.</p>}</div></section>
 <section id="preferences" className="account-settings-section"><div className="account-settings-section-intro"><SlidersHorizontal size={21}/><h2>Preferências</h2><p>Seu jeito de trabalhar na biblioteca.</p></div><div className="account-settings-section-body"><PreferencesForm key={user.uid} initial={data.preferences} onSave={async preferences=>{await saveOnboardingProgress(user,{preferences});updateData({preferences});}}/></div></section>
 <section id="data" className="account-settings-section"><div className="account-settings-section-intro"><Database size={21}/><h2>Dados e sessão</h2><p>Uma cópia da sua biblioteca, sempre com você.</p></div><div className="account-settings-section-body"><div className="settings-data-row"><div><h3>Exportar seus dados</h3><p>Perfil, prompts e imagens em um arquivo JSON.</p></div><button className="workflow-button secondary" disabled={backupPending} onClick={()=>void download()}><Download size={16}/>{backupPending?"Preparando…":"Baixar meus dados"}</button></div><p role="status" className="settings-feedback">{backupMessage}</p>{user.backend!=="supabase"&&<div className="settings-data-row"><div><h3>Atualizar acesso da conta</h3><p>Depois da autorização do seu backup, confirme a mesma conta Google para concluir a atualização.</p></div><button type="button" className="workflow-button secondary" onClick={()=>void startAccountMigration(user).catch(()=>setBackupMessage("Não foi possível abrir o Google. Tente novamente."))}>Continuar com Google</button></div>}<div className="settings-data-row"><div><h3>Sair deste navegador</h3><p>Sua biblioteca permanece salva na sua conta.</p></div><button className="workflow-button secondary" disabled={logoutPending} onClick={async()=>{setLogoutPending(true);await signOut();setLogoutPending(false);}}><LogOut size={16}/>{logoutPending?"Saindo…":"Sair da conta"}</button></div></div></section>
 </SettingsFrame>;

}
export function PreferencesForm({initial,onSave}:{initial?:AccountPreferences;onSave:(values:AccountPreferences)=>Promise<void>}){
 const [category,setCategory]=useState(initial?.defaultCategory??""),[model,setModel]=useState(initial?.defaultModel??""),[favoritesFirst,setFavoritesFirst]=useState(initial?.favoritesFirst??false);
 const [pending,setPending]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
 const busy=useRef(false);
 return <form className="settings-section" onSubmit={async event=>{event.preventDefault();if(busy.current)return;busy.current=true;setPending(true);setMessage("");setFailed(false);try{await onSave({defaultCategory:category.trim(),defaultModel:model.trim(),favoritesFirst});setMessage("Preferências salvas.");}catch{setFailed(true);setMessage("Não foi possível salvar. Confira sua conexão e tente novamente.");}finally{busy.current=false;setPending(false);}}}>
 <h2>Preferências da biblioteca</h2><p>Preencha novos prompts com seus padrões. Você pode mudar esses campos em cada prompt.</p><div className="settings-fields"><label>Categoria padrão<input maxLength={80} placeholder="Ex.: Retratos" value={category} disabled={pending} onChange={event=>setCategory(event.target.value)}/></label><AIModelPicker label="Modelo / ferramenta padrão" value={model} onChange={setModel} disabled={pending}/></div>
 <label className="mt-6 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={favoritesFirst} disabled={pending} onChange={event=>setFavoritesFirst(event.target.checked)} className="size-4 accent-primary"/>Mostrar favoritos primeiro na biblioteca</label><button type="submit" disabled={pending} className="workflow-button mt-5">{pending?"Salvando…":"Salvar preferências"}</button><p role="status" className={failed?"!text-red-700":""}>{message}</p>
 </form>;
}

export function SettingsFrame({children}:{children:ReactNode}){
 return <main className="account-settings-page"><Link href="/home" className="workflow-back"><ArrowLeft size={16}/>Voltar à biblioteca</Link><header><h1>Configurações</h1><p>Conexões, segurança e preferências da sua conta.</p></header><nav aria-label="Seções das configurações" className="account-settings-nav"><a href="#connections">Conexões</a><a href="#security">Segurança</a><a href="#preferences">Preferências</a><a href="#data">Dados e sessão</a></nav>{children}</main>;
}
