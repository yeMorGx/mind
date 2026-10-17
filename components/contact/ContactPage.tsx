"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Send } from "lucide-react";
import "@/components/billing/billing.css";
export default function ContactPage({ kind, enterprise = false }: { kind: "careers" | "business"; enterprise?: boolean }) {
 const careers = kind === "careers";
 const [available, setAvailable] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [received, setReceived] = useState(""); const locked = useRef(false);
 useEffect(() => { let alive = true; void fetch("/api/contact", { cache: "no-store" }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(value => { if (alive) setAvailable(value.available); }).catch(() => { if (alive) setAvailable(false); }); return () => { alive = false; }; }, []);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (locked.current) return; locked.current = true; setBusy(true); setError("");
  const values = Object.fromEntries(new FormData(event.currentTarget));
  try { const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, kind, consent: values.consent === "on" }) }); const result = await response.json(); if (!response.ok || !result.received || !result.id) throw new Error(result.error || "Não foi possível enviar sua mensagem."); setReceived(result.id); }
  catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível enviar. Confira a conexão e tente novamente."); }
  finally { setBusy(false); locked.current = false; }
 }
 return <main className="billing-page contact-page"><Link href="/explore" className="billing-text-link"><ArrowLeft size={16}/>Voltar ao Mind</Link><div className="contact-layout"><div className="contact-introduction"><h1>{careers ? "Vamos construir o próximo capítulo." : "Sua empresa pode fazer parte da conversa."}</h1><p>{careers ? "Quer trabalhar com a gente? Conte o que você faz, mostre seu trabalho e diga como gostaria de contribuir com o Mind." : "Divulgue sua ferramenta, apresente uma proposta de patrocínio ou converse sobre uma solução para sua equipe."}</p><ul>{(careers ? ["Candidaturas espontâneas", "Portfólio e experiência", "Interesse em colaborar com o Mind"] : ["Publicidade e divulgação de ferramentas", "Patrocínios e parcerias de conteúdo", "Propostas Enterprise para equipes"]).map(item => <li key={item}><ArrowUpRight size={17} aria-hidden="true"/>{item}</li>)}</ul><p className="contact-data-note">Os dados enviados serão usados pela administração do Mind para avaliar e responder à sua solicitação.</p></div>
  <div className="contact-form-panel">{received ? <div className="contact-success" role="status"><CheckCircle2 size={32} aria-hidden="true"/><h2>{careers ? "Candidatura recebida." : "Proposta recebida."}</h2><p>Sua mensagem foi salva para a administração do Mind. Usaremos o e-mail informado se precisarmos entrar em contato.</p><p className="contact-reference">Referência: {received}</p><button type="button" className="workflow-button secondary" onClick={() => setReceived("")}>Enviar outra mensagem</button></div> : <form onSubmit={event => void submit(event)}>
   <h2>{careers ? "Apresente seu trabalho" : "Conte sua ideia"}</h2>
   {available === null ? <p className="billing-notice" role="status">Conferindo disponibilidade do formulário…</p> : !available && <p className="billing-notice" role="status">Este canal de contato está em preparação. O envio estará disponível em breve.</p>}
   <div className="contact-field-grid"><label>Seu nome<input name="name" required minLength={2} maxLength={100} autoComplete="name"/></label><label>E-mail para contato<input name="email" type="email" required maxLength={254} autoComplete="email"/></label></div>
   <label>{careers ? "Área de interesse" : "Tipo de proposta"}<select name="subject" required defaultValue={enterprise ? "Enterprise" : ""}><option value="" disabled>Selecionar</option>{(careers ? ["Desenvolvimento", "Design", "Conteúdo", "Marketing", "Outro"] : ["Divulgação", "Patrocínio", "Parceria", "Enterprise", "Outro"]).map(value => <option key={value}>{value}</option>)}</select></label>
   {!careers && <label>Empresa ou organização<input name="organization" maxLength={160} autoComplete="organization"/></label>}
   <label>{careers ? "Link do portfólio ou LinkedIn (opcional)" : "Site da empresa (opcional)"}<input name="website" type="url" maxLength={2048} placeholder="https://"/></label>
   {!careers && <label>Investimento previsto (opcional)<select name="budget" defaultValue=""><option value="">Prefiro conversar</option>{["Até R$ 1.000", "De R$ 1.000 a R$ 5.000", "De R$ 5.000 a R$ 15.000", "Acima de R$ 15.000"].map(value => <option key={value}>{value}</option>)}</select></label>}
   <label>{careers ? "Como você gostaria de contribuir?" : "O que você tem em mente?"}<textarea name="message" rows={6} required minLength={20} maxLength={5000} placeholder={careers ? "Conte sobre sua experiência e o que gostaria de fazer no Mind." : "Descreva a proposta, o objetivo e os prazos que você tem em mente."}/><span className="contact-field-note">De 20 a 5.000 caracteres.</span></label>
   <div className="contact-trap" aria-hidden="true"><label>Deixe em branco<input name="extra" tabIndex={-1} autoComplete="off" maxLength={200}/></label></div>
   <label className="contact-consent"><input type="checkbox" name="consent" required/><span>Autorizo o Mind a usar estes dados para avaliar e responder à minha solicitação.</span></label>
   {error && <p className="billing-error" role="alert">{error}</p>}
   <button type="submit" className="workflow-button" disabled={busy || available !== true}><Send size={16}/>{busy ? "Enviando…" : careers ? "Enviar candidatura" : "Enviar proposta"}</button>
  </form>}</div>
 </div></main>;
}
