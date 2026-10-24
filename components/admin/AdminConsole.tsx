"use client";
/* eslint-disable @next/next/no-img-element -- Creator-uploaded images, including animated avatars. */
import {useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {useOnboarding} from "@/app/context/OnboardingContext";
import {useSiteLayout} from "@/components/layout/SiteLayout";
import {useI18n} from "@/components/preferences/PreferencesProvider";
import {AdminRequestError,adminRequest} from "@/lib/admin/client";
import {requireSupabaseClient} from "@/lib/supabase/client";
import BadgeEditor from "./BadgeEditor";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type {BadgeKind} from "@/lib/firebase/badges";
import CodeSlots from "@/components/ui/react-bits/CodeSlots";
import CampaignManager from "@/components/campaigns/CampaignManager";
import InquiryInbox from "@/components/contact/InquiryInbox";
import {ShieldCheck} from "lucide-react";
import "@/app/ui-tokens.css";
import "./admin.css";
type Session={role:string;permissions:string[]};
type Person={public_id:string;name:string;username:string;avatar:string;badges:BadgeKind[];plan:string};
type RecordRow={id:string;actor_id:string;action:string;target_id:string;details:Record<string,unknown>;created_at:string};
const sections=[['overview','Visão geral'],['users','Usuários e emblemas'],['campaigns','Campanhas'],['inbox','Caixa de entrada'],['analytics','Analytics e performance'],['audit','Histórico']] as const;
function AdminSession({section="overview"}:{section?:string}){
 const {t,intlLocale}=useI18n();const {user,authReady}=useOnboarding();const {requestLogin}=useSiteLayout();
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[code,setCode]=useState(""),[version,setVersion]=useState(0),[otp,setOtp]=useState(""),[pending,setPending]=useState(false);
 const [data,setData]=useState<Record<string,unknown>>({}),[people,setPeople]=useState<Person[]>([]),[logs,setLogs]=useState<RecordRow[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(0),[query,setQuery]=useState(""),[search,setSearch]=useState("");
 const [selected,setSelected]=useState<Person|null>(null),[badges,setBadges]=useState<BadgeKind[]>([]),[reason,setReason]=useState(""),[notice,setNotice]=useState("");
 const submitting=useRef(false);
 const hadSession=useRef(false);
 useEffect(()=>{if(!authReady)return;let alive=true;
  if(!user){return;}
  void adminRequest<Session>(user,"session").then(async value=>{
   if(!alive)return;if(section!=="overview"&&!value.permissions.includes(section))throw new AdminRequestError("Acesso restrito à administração.","admin_forbidden");hadSession.current=true;setSession(value);setCode("");setError("");
   if(["overview","analytics"].includes(section)){const result=await adminRequest<Record<string,unknown>>(user,section);if(alive)setData(result);}
   if(section==="users"){const result=await adminRequest<{items:Person[];total:number}>(user,"users",{search,page});if(alive){setPeople(result.items);setTotal(result.total);}}
   if(section==="audit"){const result=await adminRequest<{items:RecordRow[];total:number}>(user,"audit",{page});if(alive){setLogs(result.items);setTotal(result.total);}}
  }).catch(failure=>{if(alive){if(!(failure instanceof AdminRequestError && failure.code==="admin_mfa_required" && hadSession.current)){hadSession.current=false;setSession(null);}setError(failure instanceof Error?failure.message:"Administração indisponível. Tente novamente.");setCode(failure instanceof AdminRequestError?failure.code:"");}}).finally(()=>{if(alive)setLoading(false);});
  return()=>{alive=false;};
 },[user,authReady,section,search,page,version]);
 useEffect(()=>{if(!session)return;const timer=setInterval(()=>setVersion(v=>v+1),60000);return()=>clearInterval(timer);},[session]);
 useEffect(()=>{const challenge=()=>{setCode("admin_mfa_required");setError("Confirme o autenticador para acessar a administração.");};window.addEventListener("mind:admin-mfa",challenge);return()=>window.removeEventListener("mind:admin-mfa",challenge);},[]);
 function reload(){setLoading(true);setVersion(v=>v+1);}
 async function verify(event:FormEvent){event.preventDefault();if(pending)return;setPending(true);setError("");try{const auth=requireSupabaseClient().auth;const factors=await auth.mfa.listFactors();if(factors.error)throw factors.error;const factor=factors.data.totp.find(f=>f.status==="verified");if(!factor)throw new Error(t("Ative o autenticador nas configurações de segurança."));const result=await auth.mfa.challengeAndVerify({factorId:factor.id,code:otp});if(result.error)throw new Error(t("Código inválido ou expirado."));setOtp("");setCode("");setError("");if(session)setVersion(v=>v+1);else reload();}catch(failure){setError(failure instanceof Error?failure.message:"Código inválido ou expirado.");}finally{setPending(false);}}
 async function saveBadges(event:FormEvent){event.preventDefault();if(!user||!selected||submitting.current)return;submitting.current=true;setPending(true);setNotice("");try{await adminRequest(user,"badges",{target:selected.public_id,badges,reason});setSelected(null);setReason("");setNotice(t("Emblemas atualizados."));reload();}catch(failure){setNotice(failure instanceof Error?failure.message:t("Não foi possível atualizar os emblemas."));}finally{submitting.current=false;setPending(false);}}
 if(!authReady)return <main className="admin-workspace"><p role="status">{t("Carregando…")}</p></main>;
 if(!user)return <main className="admin-workspace"><h1>{t("Administração")}</h1><p>{t("Entre na conta administradora.")}</p><button className="workflow-button" onClick={requestLogin}>{t("Entrar")}</button></main>;
 if(!session||loading)return <main className="admin-workspace"><div className="admin-heading"><ShieldCheck size={18}/><h1>{t("Administração")}</h1></div>{loading?<div className="admin-loading" role="status">{t("Conferindo acesso seguro…")}</div>:<><p role="alert">{t(error)}</p>{code==="admin_host_required"&&<a href="https://admin.mindapp.icu/admin" className="workflow-button">{t("Abrir administração protegida")}</a>}{code==="admin_mfa_required"&&<form onSubmit={verify} className="admin-auth"><label>{t("Código do autenticador")}<CodeSlots value={otp} onChange={setOtp} disabled={pending} ariaLabel={t("Código do autenticador")}/></label><button className="workflow-button" disabled={pending||otp.length!==6}>{t("Confirmar acesso")}</button><a href="https://www.mindapp.icu/home/settings/security" target="_blank" rel="noopener noreferrer">{t("Configurar autenticador")}</a></form>}<button className="workflow-button secondary" onClick={reload}>{t("Tentar novamente")}</button><Link href="/explore" className="workflow-button secondary">{t("Voltar ao site")}</Link></>}</main>;
 return <div className="admin-workspace"><header className="admin-heading"><ShieldCheck size={18}/><h1>{t("Administração")}</h1>{section!=="campaigns"&&section!=="inbox"&&<button className="workflow-button secondary" onClick={reload}>{t("Atualizar")}</button>}</header><nav className="admin-nav" aria-label={t("Administração")}>{sections.filter(([key])=>session.permissions.includes(key)).map(([key,label])=><Link key={key} href={key==="overview"?"/admin":`/admin/${key}`} aria-current={section===key?"page":undefined}>{t(label)}</Link>)}</nav>
 {code==="admin_mfa_required"&&<form className="admin-auth" onSubmit={verify}><h2>{t("Confirmar acesso")}</h2><p role="alert">{t(error)}</p><CodeSlots value={otp} onChange={setOtp} disabled={pending} ariaLabel={t("Código do autenticador")}/><button className="workflow-button" disabled={pending||otp.length!==6}>{t("Confirmar acesso")}</button></form>}
 <div inert={code==="admin_mfa_required"}>
 {notice&&<p role="status">{t(notice)}</p>}
 {section==="campaigns"&&<CampaignManager/>}{section==="inbox"&&<InquiryInbox/>}
 {section==="overview"&&<main><h2>{t("Visão geral")}</h2><dl className="admin-metrics">{([['profiles','Perfis cadastrados'],['publications','Publicações'],['copiesToday','Cópias hoje (UTC)'],['activeCampaigns','Campanhas ativas']] as const).map(([key,label])=><div key={key}><dt>{t(label)}</dt><dd>{typeof data[key]==="number"?Number(data[key]).toLocaleString(intlLocale):"—"}</dd></div>)}</dl><p>{t("Os números vêm dos registros do Mind. Analytics e performance exigem integração.")}</p></main>}
 {section==="users"&&<main><h2>{t("Usuários e emblemas")}</h2><form className="admin-search" onSubmit={e=>{e.preventDefault();setPage(0);setSearch(query.trim());reload();}}><label>{t("Buscar por nome ou @")}<input value={query} maxLength={80} onChange={e=>setQuery(e.target.value)} placeholder={t("Nome ou @ da pessoa")}/></label><button className="workflow-button">{t("Buscar")}</button></form><div className="admin-table-wrap"><table><thead><tr><th>{t("Pessoa")}</th><th>{t("Plano")}</th><th>{t("Emblemas")}</th><th>{t("Ações")}</th></tr></thead><tbody>{people.map(person=><tr key={person.public_id}><td><Link href={`/u/${person.public_id}`} className="admin-person">{person.avatar&&<img src={person.avatar} alt=""/>}<span><strong>{person.name}</strong><small>@{person.username}</small></span></Link></td><td>{person.plan}</td><td><CreatorBadges badges={person.badges}/></td><td>{session.permissions.includes("badges")&&!person.badges.includes("owner")&&<button className="workflow-button secondary" onClick={()=>{setSelected(person);setBadges(person.badges.filter(v=>v!=="owner"));setReason("");setNotice("");}}>{t("Editar emblemas")}</button>}</td></tr>)}</tbody></table></div>{!people.length&&<p>{t("Nenhuma pessoa encontrada.")}</p>}
 {selected&&<BadgeEditor person={selected} badges={badges} onBadgesChange={setBadges} reason={reason} onReasonChange={setReason} pending={pending} onSubmit={saveBadges} onCancel={()=>setSelected(null)}/>}</main>}
 {section==="audit"&&<main><h2>{t("Histórico administrativo")}</h2><div className="admin-table-wrap"><table><thead><tr><th>{t("Data")}</th><th>{t("Ação")}</th><th>{t("Autor")}</th><th>{t("Conta ou campanha")}</th><th>{t("Detalhes")}</th></tr></thead><tbody>{logs.map(row=><tr key={row.id}><td>{new Date(row.created_at).toLocaleString(intlLocale)}</td><td>{row.action}</td><td>{row.actor_id}</td><td>{row.target_id||"—"}</td><td><details><summary>{t("Detalhes")}</summary><pre>{JSON.stringify(row.details,null,2)}</pre></details></td></tr>)}</tbody></table></div>{!logs.length&&<p>{t("Nenhuma ação registrada.")}</p>}</main>}
 {section==="analytics"&&<main><h2>{t("Analytics e performance")}</h2><section className="admin-integration"><h3>Google Analytics 4</h3><p>{t(data.ga4TagInstalled ? "Tag de medição instalada." : "Não conectado")}</p>{typeof data.ga4MeasurementId === "string" && <code>{data.ga4MeasurementId}</code>}<p>{t("Consulte os dados no Google Analytics. Os relatórios neste painel ainda não estão conectados.")}</p><a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="workflow-button secondary">{t("Abrir Google Analytics")}</a></section><section className="admin-integration"><h3>{t("Performance")}</h3><p>{t("Não conectado")}</p><p>{t("A coleta de métricas de carregamento ainda precisa ser configurada.")}</p></section></main>}
 {["users","audit"].includes(section)&&<nav className="admin-pagination"><button className="workflow-button secondary" disabled={!page} onClick={()=>{setLoading(true);setPage(v=>v-1);}}>{t("Anterior")}</button><span>{(page+1).toLocaleString(intlLocale)} · {total.toLocaleString(intlLocale)}</span><button className="workflow-button secondary" disabled={(page+1)*25>=total} onClick={()=>{setLoading(true);setPage(v=>v+1);}}>{t("Próxima")}</button></nav>}
 </div></div>;
}

export default function AdminConsole({section="overview"}:{section?:string}) { const {user}=useOnboarding();return <AdminSession key={`${user?.uid||"visitor"}:${user?.backend||"unknown"}:${section}`} section={section}/>; }
