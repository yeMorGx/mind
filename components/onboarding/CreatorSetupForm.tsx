"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import UsernameInput from "@/components/profile/UsernameInput";
import { SelectField } from "@/components/ui/SelectField";
export type CreatorSetupValues = { name:string; username:string; role:string };
const roles = ["Criador de conteúdo","Designer","Desenvolvedor","Marketing","Estudante","Empresário","Outro"];
export default function CreatorSetupForm({ publicId,initialName,initialUsername,initialRole,save }: {publicId:string;initialName:string;initialUsername:string;initialRole:string;save:(values:CreatorSetupValues)=>Promise<void>}) {
 const { t } = useI18n();

  const [name,setName]=useState(initialName),[username,setUsername]=useState(initialUsername),[role,setRole]=useState(initialRole),[pending,setPending]=useState(false),[error,setError]=useState("");
  return <><h1>{t("Como vão encontrar você?")}</h1><p className="onboarding-description">{t("Seu perfil é público. Escolha um nome e um @ único para compartilhar seus prompts.")}</p>
    <form className="onboarding-form" aria-busy={pending} onSubmit={async event=>{event.preventDefault();if(pending)return;setPending(true);setError("");try{await save({name:name.trim(),username,role});}catch(error){setError(error instanceof Error?error.message:t("Não foi possível salvar seu perfil. Tente novamente."));}finally{setPending(false);}}}>
      <div className="onboarding-field"><label htmlFor="creator-name">{t("Nome público")}</label><input id="creator-name" autoComplete="name" required maxLength={80} value={name} disabled={pending} onChange={event=>setName(event.target.value)} placeholder={t("O nome que aparece no seu perfil")}/></div>
      <UsernameInput value={username} onChange={setUsername} publicId={publicId} disabled={pending}/>
      <div className="onboarding-field"><SelectField id="creator-role" label={t("O que você faz?")} required value={role} disabled={pending} onValueChange={setRole} placeholder={t("Escolha uma opção")} options={[...new Set([...roles,...(initialRole?[initialRole]:[])])].map(value=>({value,label:value}))}/></div>
      <p className="onboarding-form-note">{t("Seu perfil fica público.")}{" "}<strong>{t("Você escolhe quais prompts publicar.")}</strong> {t("Os outros continuam privados na biblioteca.")}</p>
      {error&&<p role="alert" className="onboarding-error">{t(error)}</p>}
      <button className="onboarding-submit" disabled={pending}>{pending?t("Salvando seu perfil…"):<>{t("Continuar")}{" "}<ArrowRight size={17}/></>}</button>
    </form></>;
}
