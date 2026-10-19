"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {AnimatedCheckbox} from "@/components/ui/animated-checkbox";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Send } from "lucide-react";
import { SelectField } from "@/components/ui/SelectField";
import "@/components/billing/billing.css";
export default function ContactPage({ kind, enterprise = false }: { kind: "careers" | "business"; enterprise?: boolean }) {
 const { t } = useI18n();

 const careers = kind === "careers";
 const [available, setAvailable] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [received, setReceived] = useState(""), [subject,setSubject]=useState(enterprise?"Enterprise":""), [budget,setBudget]=useState(""); const locked = useRef(false);
 useEffect(() => { let alive = true; void fetch("/api/contact", { cache: "no-store" }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(value => { if (alive) setAvailable(value.available); }).catch(() => { if (alive) setAvailable(false); }); return () => { alive = false; }; }, []);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (locked.current) return; locked.current = true; setBusy(true); setError("");
  const values = Object.fromEntries(new FormData(event.currentTarget));
  try { const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, kind, consent: values.consent === "on" }) }); const result = await response.json(); if (!response.ok || !result.received || !result.id) throw new Error(result.error || "Não foi possível enviar sua mensagem."); setReceived(result.id); }
  catch (failure) { setError(failure instanceof Error ? failure.message : t("Não foi possível enviar. Confira a conexão e tente novamente.")); }
  finally { setBusy(false); locked.current = false; }
 }
 return <main className="billing-page contact-page"><Link href="/explore" className="billing-text-link"><ArrowLeft size={16}/>{t("Voltar ao Mind")}</Link><div className="contact-layout"><div className="contact-introduction"><h1>{careers ? t("Vamos construir o próximo capítulo.") : t("Sua empresa pode fazer parte da conversa.")}</h1><p>{careers ? t("Quer trabalhar com a gente? Conte o que você faz, mostre seu trabalho e diga como gostaria de contribuir com o Mind.") : t("Divulgue sua ferramenta, apresente uma proposta de patrocínio ou converse sobre uma solução para sua equipe.")}</p><ul>{(careers ? ["Candidaturas espontâneas", "Portfólio e experiência", "Interesse em colaborar com o Mind"] : ["Publicidade e divulgação de ferramentas", "Patrocínios e parcerias de conteúdo", "Propostas Enterprise para equipes"]).map(item => <li key={item}><ArrowUpRight size={17} aria-hidden="true"/>{t(item)}</li>)}</ul><p className="contact-data-note">{t("Os dados enviados serão usados pela administração do Mind para avaliar e responder à sua solicitação.")}</p></div>
  <div className="contact-form-panel">{received ? <div className="contact-success" role="status"><CheckCircle2 size={32} aria-hidden="true"/><h2>{careers ? t("Candidatura recebida.") : t("Proposta recebida.")}</h2><p>{t("Sua mensagem foi salva para a administração do Mind. Usaremos o e-mail informado se precisarmos entrar em contato.")}</p><p className="contact-reference">{t("Referência:")}{" "}{received}</p><button type="button" className="workflow-button secondary" onClick={() => setReceived("")}>{t("Enviar outra mensagem")}</button></div> : <form onSubmit={event => void submit(event)}>
   <h2>{careers ? t("Apresente seu trabalho") : t("Conte sua ideia")}</h2>
   {available === null ? <p className="billing-notice" role="status">{t("Conferindo disponibilidade do formulário…")}</p> : !available && <p className="billing-notice" role="status">{t("Este canal de contato está em preparação. O envio estará disponível em breve.")}</p>}
   <div className="contact-field-grid"><label>{t("Seu nome")}<input name="name" required minLength={2} maxLength={100} autoComplete="name"/></label><label>{t("E-mail para contato")}<input name="email" type="email" required maxLength={254} autoComplete="email"/></label></div>
   <SelectField label={careers ? t("Área de interesse") : t("Tipo de proposta")} name="subject" required value={subject} onValueChange={setSubject} placeholder={t("Selecionar")} options={(careers ? ["Desenvolvimento", "Design", "Conteúdo", "Marketing", "Outro"] : ["Divulgação", "Patrocínio", "Parceria", "Enterprise", "Outro"]).map(value=>({value,label:value}))}/>
   {!careers && <label>{t("Empresa ou organização")}<input name="organization" maxLength={160} autoComplete="organization"/></label>}
   <label>{careers ? t("Link do portfólio ou LinkedIn (opcional)") : t("Site da empresa (opcional)")}<input name="website" type="url" maxLength={2048} placeholder="https://"/></label>
   {!careers && <SelectField label={t("Investimento previsto (opcional)")} name="budget" value={budget} onValueChange={setBudget} placeholder={t("Prefiro conversar")} options={[{value:"",label:t("Prefiro conversar")},...["Até R$ 1.000", "De R$ 1.000 a R$ 5.000", "De R$ 5.000 a R$ 15.000", "Acima de R$ 15.000"].map(value=>({value,label:value}))]}/>}
   <label>{careers ? t("Como você gostaria de contribuir?") : t("O que você tem em mente?")}<textarea name="message" rows={6} required minLength={20} maxLength={5000} placeholder={careers ? t("Conte sobre sua experiência e o que gostaria de fazer no Mind.") : t("Descreva a proposta, o objetivo e os prazos que você tem em mente.")}/><span className="contact-field-note">{t("De 20 a 5.000 caracteres.")}</span></label>
   <div className="contact-trap" aria-hidden="true"><label>{t("Deixe em branco")}<input name="extra" tabIndex={-1} autoComplete="off" maxLength={200}/></label></div>
   <AnimatedCheckbox className="contact-consent" name="consent" required title={t("Autorizo o Mind a usar estes dados para avaliar e responder à minha solicitação.")}/>
   {error && <p className="billing-error" role="alert">{t(error)}</p>}
   <button type="submit" className="workflow-button" disabled={busy || available !== true}><Send size={16}/>{busy ? t("Enviando…") : careers ? t("Enviar candidatura") : t("Enviar proposta")}</button>
  </form>}</div>
 </div></main>;
}
