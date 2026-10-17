"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { createEmailPasswordAccount, getFirebaseAuthMessage } from "@/lib/firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { data, updateData, user, authReady, profileLoading, firebaseConfigured } = useOnboarding();
  const { requestLogin } = useSiteLayout();
  const [name,setName] = useState(""), [email,setEmail] = useState(""), [password,setPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false), [error,setError] = useState(""), [pending,setPending] = useState(false);
  useEffect(() => { if (authReady && user && !profileLoading) router.replace(data.onboardingComplete ? "/home" : "/register/step-2"); },[authReady,user,profileLoading,data.onboardingComplete,router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return; setError("");
    if (!name.trim()) { setError("Digite seu nome."); return; }
    setPending(true);
    try { const account = await createEmailPasswordAccount(name,email,password); updateData({name:name.trim(),email:account.email ?? email.trim()}); router.push("/register/step-2"); }
    catch (error) { setError(getFirebaseAuthMessage(error)); } finally { setPending(false); }
  }
  return <OnboardingLayout step={1}>
    <h1>Crie sua conta.</h1><p className="onboarding-description">Suas ideias merecem um lugar próprio.<br/>Vamos preparar o seu.</p>
    <form onSubmit={submit} className="onboarding-form" aria-busy={pending}>
      <div className="onboarding-field"><label htmlFor="register-name">Seu nome</label><input id="register-name" autoComplete="name" required maxLength={80} disabled={pending} value={name} onChange={event=>setName(event.target.value)} placeholder="Como você se chama?"/></div>
      <div className="onboarding-field"><label htmlFor="register-email">E-mail</label><input id="register-email" autoComplete="email" type="email" required disabled={pending} value={email} onChange={event=>setEmail(event.target.value)} placeholder="voce@exemplo.com"/></div>
      <div className="onboarding-field"><label htmlFor="register-password">Crie uma senha</label><div className="onboarding-password"><input id="register-password" autoComplete="new-password" type={showPassword?"text":"password"} required minLength={6} disabled={pending} value={password} onChange={event=>setPassword(event.target.value)} placeholder="Pelo menos 6 caracteres"/><button type="button" aria-label={showPassword?"Ocultar senha":"Mostrar senha"} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
      {!firebaseConfigured && <p className="onboarding-error">O cadastro por e-mail está indisponível neste momento. Tente outra forma de acesso.</p>}
      {error && <p role="alert" className="onboarding-error">{error}</p>}
      <button className="onboarding-submit" disabled={pending||!authReady||!firebaseConfigured}>{pending?"Criando sua conta…":<>Criar conta <ArrowRight size={17}/></>}</button>
      <button type="button" className="onboarding-back justify-center" onClick={requestLogin}>Ver outras formas de acesso</button>
    </form>
  </OnboardingLayout>;
}
