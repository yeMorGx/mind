"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import Logo from "@/components/ui/logo";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import "./onboarding.css";

const steps = [
  { title: "Sua conta", detail: "Seus dados de acesso" },
  { title: "Seu perfil", detail: "Um nome e um @ só seu" },
  { title: "Sua biblioteca", detail: "Um espaço para suas ideias" },
  { title: "Tudo pronto", detail: "Hora de começar a criar" },
];
export default function OnboardingLayout({ children, step }: { children: ReactNode; step: number }) {
  const { user } = useOnboarding();
  const { requestLogin, signOut } = useSiteLayout();
  return <main className="onboarding-shell">
    <aside className="onboarding-aside">
      <Link href="/explore" className="onboarding-brand" aria-label="Mind — explorar"><span><Logo/></span>Mind</Link>
      <div className="onboarding-journey"><h2>Da sua ideia<br/>ao próximo resultado.</h2><ol aria-label="Etapas do cadastro">{steps.map((item,index) => <li key={item.title} aria-current={step === index + 1 ? "step" : undefined} data-complete={step > index + 1 || undefined}><span className="onboarding-step-icon" aria-hidden="true">{step > index + 1 ? <Check size={16}/> : index + 1}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span></li>)}</ol></div>
      <p className="onboarding-aside-note">Guarde suas ideias.<br/>Compartilhe quando quiser.</p>
    </aside>
    <div className="onboarding-content">
      <div className="onboarding-top"><Link href="/explore"><ArrowLeft size={15}/>Explorar</Link>{user ? <button type="button" onClick={() => void signOut()}>Sair da conta</button> : <span>Já tem uma conta? <button type="button" onClick={requestLogin}>Entrar</button></span>}</div>
      <div className="onboarding-form-area"><p className="onboarding-progress" aria-live="polite">Etapa {step} de 4 · {steps[step - 1]?.title}</p><div className="onboarding-mobile-progress" aria-hidden="true">{steps.map((item,index) => <span key={item.title} data-done={step >= index + 1 || undefined}/>)}</div>{children}</div>
      <p className="onboarding-bottom">Seu espaço para criar e compartilhar prompts.</p>
    </div>
  </main>;
}
