"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import Logo from "@/components/ui/logo";
import OnboardingBackground from "./OnboardingBackground";
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
 const { t } = useI18n();

  const { user } = useOnboarding();
  const { requestLogin, signOut } = useSiteLayout();
  return <main className="onboarding-shell">
    <aside className="onboarding-aside">
      <div className="onboarding-card">
      <Link href="/explore" className="onboarding-brand" aria-label={t("Mind — explorar")}><span aria-hidden="true"><Logo viewBox="240 220 550 550"/></span></Link>
      <div className="onboarding-journey"><h2>{t("Da sua ideia")}<br/>{t("ao próximo resultado.")}</h2><ol aria-label={t("Etapas do cadastro")}>{steps.map((item,index) => <li key={item.title} aria-current={step === index + 1 ? "step" : undefined} data-complete={step > index + 1 || undefined}><span className="onboarding-step-icon" aria-hidden="true">{step > index + 1 ? <Check size={16}/> : index + 1}</span><span><strong>{t(item.title)}</strong><small>{t(item.detail)}</small></span></li>)}</ol></div>
      </div>
      <OnboardingBackground/>
    </aside>
    <div className="onboarding-content">
      <div className="onboarding-top"><Link href="/explore"><ArrowLeft size={15}/>{t("Explorar")}</Link>{user ? <button type="button" onClick={() => void signOut()}>{t("Sair da conta")}</button> : <span>{t("Já tem uma conta?")}{" "}<button type="button" onClick={requestLogin}>{t("Entrar")}</button></span>}</div>
      <div className="onboarding-form-area"><p className="onboarding-progress" aria-live="polite">{t("Etapa")}{" "}{step} {t("de 4 ·")}{" "}{t(steps[step - 1]?.title ?? "")}</p><div className="onboarding-mobile-progress" aria-hidden="true">{steps.map((item,index) => <span key={item.title} data-done={step >= index + 1 || undefined}/>)}</div>{children}</div>
      <p className="onboarding-bottom">{t("Seu espaço para criar e compartilhar prompts.")}</p>
    </div>
  </main>;
}
