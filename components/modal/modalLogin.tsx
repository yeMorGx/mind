"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowRight, Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import "./login-modal.css";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord, FaGithub } from "react-icons/fa";
import {
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";

import { selectNativeSession } from "@/lib/backend";
import Logo from "@/components/ui/logo";
import { getFirebaseServices } from "@/lib/firebase/client";
import { ensureUserProfile, getAuthDestination, getFirebaseAuthMessage } from "@/lib/firebase/auth";
import { getIdentityProviders } from "@/lib/supabase/identity-providers";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getNativePublicCreator, restoreNativeAccount, startAccountMigration } from "@/lib/supabase/mind";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({
  isOpen,
  onClose,
}: Props) {
 const { t } = useI18n();

  const router = useRouter();
  const pathname = usePathname();
  const adminLogin = pathname === "/admin" || pathname.startsWith("/admin/");
  const fieldId = useId();
  const returnFocus = useRef<HTMLElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [providers, setProviders] = useState<Record<string,boolean>>({});
  useEffect(()=>{if(!isOpen||!isSupabaseConfigured)return;let active=true;void getIdentityProviders().then(value=>{if(active)setProviders(value);}).catch(()=>{});return()=>{active=false;};},[isOpen]);
  async function nativeSignIn(provider:"google"|"github"|"discord"){
    setPending(true);setError("");
    try{const client=getSupabaseClient();if(!client)throw new Error();sessionStorage.removeItem("mind-migration-source");if(adminLogin)sessionStorage.setItem("mind-auth-return-to","/admin");sessionStorage.setItem("mind-native-login-provider",provider);const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}/auth/callback`,...(provider==="google"?{queryParams:{prompt:"select_account"}}:{})}});if(error)throw error;}
    catch{setError(t("Não foi possível abrir este login. Tente novamente mais tarde."));setPending(false);}
  }

  async function finishSignIn(action: () => Promise<UserCredential>) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const credential = await action();
      const migrated = isSupabaseConfigured ? await getNativePublicCreator(credential.user.uid) : null;
      if (migrated?.backend === "supabase") {
        const restored = await restoreNativeAccount(credential.user.uid);
        if (restored) { selectNativeSession(restored.public_id); onClose(); router.push("/home"); return; }
        sessionStorage.removeItem("mind-native-login-attempt");
        await startAccountMigration(credential.user);
        return;
      }
      await ensureUserProfile(credential.user);
      const destination = await getAuthDestination(credential.user);
      onClose();
      router.push(destination);
    } catch (signInError) {
      setError(getFirebaseAuthMessage(signInError));
    } finally {
      setPending(false);
    }
  }

  function handleEmailSignIn() {
    return finishSignIn(() => {
      const services = getFirebaseServices();
      if (!services) throw new Error("Configure o Firebase no arquivo .env.local.");
      return signInWithEmailAndPassword(services.auth, email.trim(), password);
    });
  }

  function handleGoogleSignIn() {
    if (adminLogin) return nativeSignIn("google");
    return finishSignIn(() => {
      const services = getFirebaseServices();
      if (!services) throw new Error("Configure o Firebase no arquivo .env.local.");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      return signInWithPopup(services.auth, provider);
    });
  }

  function handleDiscordSignIn() {
    if (providers.discord) return nativeSignIn("discord");
    return finishSignIn(() => {
      const services = getFirebaseServices();
      if (!services) throw new Error("Configure o Firebase no arquivo .env.local.");
      return signInWithPopup(services.auth, new OAuthProvider("oidc.discord"));
    });
  }

  async function handlePasswordReset() {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError(t("Digite seu e-mail para receber o link de redefinição."));
      return;
    }

    const services = getFirebaseServices();
    if (!services) {
      setError(t("Configure o Firebase no arquivo .env.local."));
      return;
    }

    setPending(true);
    try {
      await sendPasswordResetEmail(services.auth, email.trim());
      setNotice(t("Se houver uma conta com esse e-mail, enviaremos um link para redefinir a senha."));
    } catch (resetError) {
      const code =
        typeof resetError === "object" && resetError !== null && "code" in resetError
          ? String(resetError.code)
          : "";
      if (code === "auth/user-not-found") {
        setNotice(t("Se houver uma conta com esse e-mail, enviaremos um link para redefinir a senha."));
      } else {
        setError(getFirebaseAuthMessage(resetError));
      }
    } finally {
      setPending(false);
    }
  }

  return <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="mind-login-overlay"/>
      <Dialog.Content className="mind-login-dialog" aria-describedby={`${fieldId}-description`}
        onOpenAutoFocus={() => { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }}
        onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); }}>
        <Dialog.Close className="mind-login-close" aria-label={t("Fechar login")}><X size={19}/></Dialog.Close>
        <div className="mind-login-body">
          <div className="mind-login-heading">
            <span className="mind-login-logo" aria-hidden="true"><Logo/></span>
            <Dialog.Title>{t("Entre no Mind")}</Dialog.Title>
            <Dialog.Description id={`${fieldId}-description`}>{t(adminLogin ? "Entre na conta administradora." : "Acesse seus prompts e continue criando.")}</Dialog.Description>
          </div>
          <div className="mind-login-providers" aria-label={t("Entrar com outra conta")}>
            <button type="button" disabled={pending} onClick={() => void handleGoogleSignIn()}><FcGoogle size={20} aria-hidden="true"/><span>{t("Continuar com Google")}</span></button>
            {!adminLogin && <div className="mind-login-other-providers">
              <button type="button" disabled={pending} onClick={() => void handleDiscordSignIn()}><FaDiscord size={20} className="mind-login-discord" aria-hidden="true"/><span>Discord</span></button>
              {providers.github && <button type="button" disabled={pending} onClick={() => void nativeSignIn("github")}><FaGithub size={20} aria-hidden="true"/><span>GitHub</span></button>}
            </div>}
          </div>
          {!adminLogin && <><div className="mind-login-divider"><span>{t("ou entre com e-mail")}</span></div>
          <form className="mind-login-form" aria-busy={pending} onSubmit={event => { event.preventDefault(); void handleEmailSignIn(); }}>
            <div className="mind-login-field">
              <label htmlFor={`${fieldId}-email`}>{t("E-mail")}</label>
              <input id={`${fieldId}-email`} required type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} disabled={pending} value={email} onChange={event => setEmail(event.target.value)} placeholder={t("voce@exemplo.com")}/>
            </div>
            <div className="mind-login-field">
              <div className="mind-login-password-label"><label htmlFor={`${fieldId}-password`}>{t("Senha")}</label><button type="button" onClick={() => void handlePasswordReset()} disabled={pending}>{t("Esqueceu a senha?")}</button></div>
              <div className="mind-login-password"><input id={`${fieldId}-password`} required type={showPassword ? "text" : "password"} autoComplete="current-password" disabled={pending} value={password} onChange={event => setPassword(event.target.value)} placeholder={t("Sua senha")}/><button type="button" aria-label={showPassword ? t("Ocultar senha") : t("Mostrar senha")} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
            </div>
            {error && <p role="alert" className="mind-login-message is-error">{t(error)}</p>}
            {notice && <p role="status" className="mind-login-message is-notice">{t(notice)}</p>}
            <button type="submit" className="mind-login-submit" disabled={pending || !email.trim() || !password}>{pending ? <><LoaderCircle size={17} className="mind-login-spinner"/>{t("Aguarde…")}</> : <>{t("Entrar")}{" "}<ArrowRight size={17}/></>}</button>
          </form></>}
          {adminLogin && error && <p role="alert" className="mind-login-message is-error">{t(error)}</p>}
        </div>
        {!adminLogin && <div className="mind-login-signup"><span>{t("Ainda não tem uma conta?")}</span><button type="button" disabled={pending} onClick={() => { onClose(); router.push("/register"); }}>{t("Criar conta")}{" "}<ArrowRight size={14}/></button></div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
