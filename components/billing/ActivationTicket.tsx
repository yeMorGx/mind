"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef, useState } from "react";
import { Check, MoveUpRight, X } from "lucide-react";
import { getImageProps } from "next/image";
import Logo from "@/components/ui/logo";
import TearTicket from "@/components/ui/react-bits/TearTicket";
import "./activation-ticket.css";
const { props: ticketArtwork } = getImageProps({ src: "/modal.png", alt: "", width: 1040, height: 720 });
/** Only mount after the authenticated server confirms paid access. This component never grants access. */
export default function ActivationTicket({ accountId, activationId, plan, memberName }: { accountId: string; activationId: string; plan: string; memberName?: string }) {
 const { t } = useI18n();

 const dialog = useRef<HTMLDialogElement>(null), doneButton = useRef<HTMLButtonElement>(null);
 const [torn, setTorn] = useState(false);
 const storageKey = `mind:activation-ticket:${accountId}:${activationId}`;
 useEffect(() => {
  try { if (localStorage.getItem(storageKey)) return; } catch { /* Celebration still works without storage. */ }
  const element = dialog.current;
  element?.showModal();
  return () => element?.close();
 }, [storageKey]);
 function remember() { try { localStorage.setItem(storageKey, "seen"); } catch { /* No effect on billing. */ } }
 function close() { remember(); dialog.current?.close(); }
 function finish() { remember(); setTorn(true); }
 useEffect(() => { if (torn) doneButton.current?.focus(); }, [torn]);
 return <dialog ref={dialog} className="activation-dialog" aria-labelledby="activation-title" aria-describedby="activation-description" onCancel={event => { event.preventDefault(); close(); }}>
  <button type="button" className="activation-close" aria-label={t("Fechar celebração")} onClick={close}><X size={20}/></button>
  <div className={`activation-heading${torn ? "" : " activation-screenreader"}`}><h2 id="activation-title">{torn ? t("Plano ativado!") : t("Seu próximo capítulo no Mind.")}</h2><p id="activation-description">{torn ? t("Tudo pronto. Aproveite os benefícios do Mind {v0}.", {v0: (plan)}) : t("Assinatura confirmada. Puxe a ponta do seu ticket para comemorar.")}</p></div>
  <div className="activation-ticket-stage" hidden={torn}><TearTicket ariaLabel={t("Rasgar ticket: arraste a ponta ou pressione Enter")} image={ticketArtwork.src} imageAlt="" scrim={false} imageRadius={10} width={520} height={280} stubSize={150} rotate={-4} tilt background="#242426" stubBackground="#242426" color="#ffffff" borderColor="#ffffff14" recenter={false} onTear={finish} stub={<div className="activation-stub"><span className="activation-stub-brand">Mind</span><strong>{plan}</strong><span className="activation-member-label">{t("Seu passe de criador.")}</span><span className="activation-tear-hint">{t("Puxe para começar")}{" "}<MoveUpRight size={19}/></span></div>}><div className="activation-ticket-copy"><div className="activation-art-signature"><span className="activation-mark"><Logo/></span><span>mind</span></div><div className="activation-ticket-footer"><span>{memberName ? t("Feito para {v0}", {v0: (memberName.split(" ")[0])}) : t("Seu próximo capítulo.")}</span><span className="activation-confirmed"><Check size={14}/>{t("Confirmado")}</span></div></div></TearTicket></div>
  {torn && <div className="activation-complete" role="status"><Check size={38} aria-hidden="true"/><span className="activation-screenreader">{t("Plano ativado! Seu Mind")}{" "}{plan} {t("está pronto.")}</span></div>}
  <div className="activation-actions">{torn ? <button ref={doneButton} type="button" className="workflow-button" onClick={close}>{t("Continuar")}</button> : <button type="button" className="activation-keyboard-skip" onClick={close}>{t("Continuar sem animação")}</button>}</div>
 </dialog>;
}
