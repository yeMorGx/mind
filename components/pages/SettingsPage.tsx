"use client";
import {AppearanceControls} from "@/components/preferences/AppearanceControls";
import {useI18n} from "@/components/preferences/PreferencesProvider";
import {AnimatedCheckbox} from "@/components/ui/animated-checkbox";
import Connections from "@/components/settings/Connections";
import MFASettings from "@/components/settings/MFASettings";
import {startAccountMigration} from "@/lib/supabase/mind";
import AIModelPicker from "@/components/models/AIModelPicker";
import {useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {ArrowLeft,Download,LogOut,Link2,ShieldCheck,SlidersHorizontal,Database,CreditCard} from "lucide-react";
import {useOnboarding} from "@/app/context/OnboardingContext";
import {useSiteLayout} from "@/components/layout/SiteLayout";
import {saveOnboardingProgress,type AccountPreferences} from "@/lib/firebase/data";
import {downloadOwnFirebaseBackup} from "@/lib/firebase/backup";
export type SettingsSection = "appearance" | "connections" | "security" | "preferences" | "billing" | "data";
export default function SettingsPage({section="appearance"}:{section?:SettingsSection}){
 const { t } = useI18n();

 const {user,authReady,profileLoading,data,updateData}=useOnboarding();
 const {requestLogin,signOut}=useSiteLayout();
 const [backupPending,setBackupPending]=useState(false),[backupMessage,setBackupMessage]=useState("");
 const [logoutPending,setLogoutPending]=useState(false);
 const backupBusy=useRef(false);
 if(section!=="appearance"&&(!authReady||profileLoading))return <main className="workflow-page"><p role="status">{t("Carregando configurações…")}</p></main>;
 if(!user&&section!=="appearance")return <SettingsFrame section={section}><div className="settings-sign-in"><h2>{t("Configurações da conta")}</h2><p>{t("Entre na sua conta para acessar suas preferências.")}</p><button className="workflow-button mt-6" onClick={requestLogin}>{t("Entrar")}</button></div></SettingsFrame>;
 async function download(){
  if(backupBusy.current)return;backupBusy.current=true;setBackupPending(true);setBackupMessage("");
  try{const count=await downloadOwnFirebaseBackup();setBackupMessage(`Download iniciado: perfil, biblioteca e ${count} ${count===1?"prompt":"prompts"}.`);}
  catch{setBackupMessage("Não foi possível baixar seus dados. Confira sua conexão e tente novamente.");}
  finally{backupBusy.current=false;setBackupPending(false);}
 }
 return <SettingsFrame section={section}>
 {section==="appearance"&&<section className="account-settings-section"><div className="account-settings-section-intro"><SlidersHorizontal size={21}/><h2>{t("Aparência")}</h2><p>{t("Tema e idioma, do seu jeito.")}</p></div><div className="account-settings-section-body"><AppearanceControls/></div></section>}
 {user&&section==="connections"&&<section id="connections" className="account-settings-section"><div className="account-settings-section-intro"><Link2 size={21}/><h2>{t("Contas conectadas")}</h2><p>{t("Escolha as contas que você usa para entrar no Mind.")}</p></div><div className="account-settings-section-body">{user.backend==="supabase"?<Connections/>:<p>{t("Entre novamente com Google para gerenciar as conexões desta conta.")}</p>}</div></section>}
 {user&&section==="security"&&<section id="security" className="account-settings-section"><div className="account-settings-section-intro"><ShieldCheck size={21}/><h2>{t("Segurança e acesso")}</h2><p>{t("Adicione uma etapa de proteção ao seu login.")}</p></div><div className="account-settings-section-body"><div className="settings-account-email"><span>{t("E-mail da conta")}</span><strong>{user.email}</strong><p>{t("O e-mail é gerenciado pelo provedor conectado.")}</p></div>{user.backend==="supabase"?<MFASettings/>:<p className="mt-5 text-sm text-muted">{t("Use o login Google atualizado para configurar o autenticador.")}</p>}</div></section>}
 {user&&section==="preferences"&&<section id="preferences" className="account-settings-section"><div className="account-settings-section-intro"><SlidersHorizontal size={21}/><h2>{t("Preferências")}</h2><p>{t("Seu jeito de trabalhar na biblioteca.")}</p></div><div className="account-settings-section-body"><PreferencesForm key={user.uid} initial={data.preferences} onSave={async preferences=>{await saveOnboardingProgress(user,{preferences});updateData({preferences});}}/></div></section>}
 {user&&section==="billing"&&<section id="billing" className="account-settings-section"><div className="account-settings-section-intro"><CreditCard size={21}/><h2>{t("Assinatura")}</h2><p>{t("Plano, desbloqueios e pagamentos.")}</p></div><div className="account-settings-section-body"><Link href="/home/billing" className="workflow-button">{t("Ver minha assinatura")}</Link><Link href="/plans" className="workflow-button secondary ml-3">{t("Conhecer os planos")}</Link></div></section>}
 {user&&section==="data"&&<section id="data" className="account-settings-section"><div className="account-settings-section-intro"><Database size={21}/><h2>{t("Dados e sessão")}</h2><p>{t("Uma cópia da sua biblioteca, sempre com você.")}</p></div><div className="account-settings-section-body"><div className="settings-data-row"><div><h3>{t("Exportar seus dados")}</h3><p>{t("Perfil, prompts e imagens em um arquivo JSON.")}</p></div><button className="workflow-button secondary" disabled={backupPending} onClick={()=>void download()}><Download size={16}/>{backupPending?t("Preparando…"):t("Baixar meus dados")}</button></div><p role="status" className="settings-feedback">{t(backupMessage)}</p>{user.backend!=="supabase"&&<div className="settings-data-row"><div><h3>{t("Atualizar acesso da conta")}</h3><p>{t("Depois da autorização do seu backup, confirme a mesma conta Google para concluir a atualização.")}</p></div><button type="button" className="workflow-button secondary" onClick={()=>void startAccountMigration(user).catch(()=>setBackupMessage("Não foi possível abrir o Google. Tente novamente."))}>{t("Continuar com Google")}</button></div>}<div className="settings-data-row"><div><h3>{t("Sair deste navegador")}</h3><p>{t("Sua biblioteca permanece salva na sua conta.")}</p></div><button className="workflow-button secondary" disabled={logoutPending} onClick={async()=>{setLogoutPending(true);await signOut();setLogoutPending(false);}}><LogOut size={16}/>{logoutPending?t("Saindo…"):t("Sair da conta")}</button></div></div></section>}
 </SettingsFrame>;

}
export function PreferencesForm({initial,onSave}:{initial?:AccountPreferences;onSave:(values:AccountPreferences)=>Promise<void>}){
 const { t } = useI18n();

 const [category,setCategory]=useState(initial?.defaultCategory??""),[model,setModel]=useState(initial?.defaultModel??""),[favoritesFirst,setFavoritesFirst]=useState(initial?.favoritesFirst??false);
 const [pending,setPending]=useState(false),[message,setMessage]=useState(""),[failed,setFailed]=useState(false);
 const busy=useRef(false);
 return <form className="settings-section" onSubmit={async event=>{event.preventDefault();if(busy.current)return;busy.current=true;setPending(true);setMessage("");setFailed(false);try{await onSave({defaultCategory:category.trim(),defaultModel:model.trim(),favoritesFirst});setMessage(t("Preferências salvas."));}catch{setFailed(true);setMessage(t("Não foi possível salvar. Confira sua conexão e tente novamente."));}finally{busy.current=false;setPending(false);}}}>
 <h2>{t("Preferências da biblioteca")}</h2><p>{t("Preencha novos prompts com seus padrões. Você pode mudar esses campos em cada prompt.")}</p><div className="settings-fields"><label>{t("Categoria padrão")}<input maxLength={80} placeholder={t("Ex.: Retratos")} value={category} disabled={pending} onChange={event=>setCategory(event.target.value)}/></label><AIModelPicker label={t("Modelo / ferramenta padrão")} value={model} onChange={setModel} disabled={pending}/></div>
 <AnimatedCheckbox className="mt-6 text-sm" checked={favoritesFirst} disabled={pending} onChange={event=>setFavoritesFirst(event.target.checked)} title={t("Mostrar favoritos primeiro na biblioteca")}/><button type="submit" disabled={pending} className="workflow-button mt-5">{pending?t("Salvando…"):t("Salvar preferências")}</button><p role="status" className={failed?"!text-red-700":""}>{t(message)}</p>
 </form>;
}

export function SettingsFrame({children,section}:{children:ReactNode;section:SettingsSection}){
 const {t}=useI18n();
 const sections: [SettingsSection,string][]=[["appearance","Aparência"],["connections","Conexões"],["security","Segurança"],["preferences","Preferências"],["billing","Assinatura"],["data","Dados e sessão"]];
 return <main className="account-settings-page"><Link href="/home" className="workflow-back"><ArrowLeft size={16}/>{t("Voltar à biblioteca")}</Link><header><h1>{t("Configurações")}</h1><p>{t("Conexões, segurança e preferências da sua conta.")}</p></header><div className="account-settings-layout"><nav aria-label={t("Seções das configurações")} className="account-settings-nav">{sections.map(([id,label])=><Link key={id} href={`/home/settings/${id}`} aria-current={id===section?"page":undefined}>{t(label)}</Link>)}</nav><div className="account-settings-panel" key={section}>{children}</div></div></main>;
}
