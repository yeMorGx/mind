"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { accountHeaders } from "@/lib/billing/client";
import "@/components/billing/billing.css";
type Inquiry = { id: string; kind: "careers" | "business"; name: string; email: string; organization: string; subject: string; website: string; budget: string; message: string; created_at: string };
function InboxSession() {
 const { t, intlLocale } = useI18n();

 const { user, authReady } = useOnboarding(), { requestLogin } = useSiteLayout();
 const [items, setItems] = useState<Inquiry[]>([]), [page, setPage] = useState(0), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState("");
 useEffect(() => { if (!user) return; let alive = true; void (async () => { try { const response = await fetch("/api/contact/inbox", { method: "POST", headers: { ...await accountHeaders(user), "Content-Type": "application/json" }, body: JSON.stringify({ page }), cache: "no-store" }); const value = await response.json(); if (!response.ok) throw new Error(value.error); if (alive) { setItems(value.inquiries); setTotal(value.total); setError(""); } } catch (failure) { if (alive) { setItems([]); setError(failure instanceof Error ? failure.message : "Não foi possível carregar as mensagens."); } } finally { if (alive) setLoading(false); } })(); return () => { alive = false; }; }, [user, page]);
 if (!authReady) return <main className="billing-page"><p role="status">{t("Carregando…")}</p></main>;
 if (!user) return <main className="billing-page"><h1>{t("Contatos recebidos")}</h1><p className="mt-4 text-muted">{t("Entre na conta administradora.")}</p><button type="button" className="workflow-button mt-6" onClick={requestLogin}>{t("Entrar")}</button></main>;
 return <main className="billing-page"><Link href="/home/billing" className="billing-text-link"><ArrowLeft size={16}/>{t("Minha conta")}</Link><div className="billing-heading"><div><h1>{t("Contatos recebidos")}</h1><p>{t("Candidaturas e propostas enviadas ao Mind.")}</p></div></div>{loading && <p role="status">{t("Carregando mensagens…")}</p>}{error && <p role="alert" className="billing-error">{t(error)}</p>}{!loading && !error && !items.length && <p className="billing-notice">{t("Nenhuma mensagem recebida.")}</p>}<div className="inquiry-list">{items.map(item => <article key={item.id}><div className="inquiry-heading"><div><span>{item.kind === "careers" ? t("Candidatura") : t("Empresa")} · {item.subject}</span><h2>{item.name}</h2><p>{item.organization}</p></div><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString(intlLocale)}</time></div><a href={`mailto:${encodeURIComponent(item.email)}`} className="billing-text-link">{item.email}</a>{item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="billing-text-link mt-2">{t("Site ou portfólio")}{" "}<ArrowUpRight size={15}/></a>}{item.budget && <p className="mt-4 text-sm text-muted">{t("Investimento:")}{" "}{item.budget}</p>}<p className="inquiry-message">{item.message}</p></article>)}</div>{!error && <nav className="resource-actions mt-8" aria-label={t("Páginas de mensagens")}><button type="button" className="workflow-button secondary" disabled={loading || page === 0} onClick={() => { setLoading(true); setPage(value => value - 1); }}>{t("Anterior")}</button><span className="text-sm text-muted">{t("Página")}{" "}{page + 1} · {total} {t("mensagens")}</span><button type="button" className="workflow-button secondary" disabled={loading || (page + 1) * 25 >= total} onClick={() => { setLoading(true); setPage(value => value + 1); }}>{t("Próxima")}</button></nav>}</main>;
}
export default function InquiryInbox() { const { user } = useOnboarding(); return <InboxSession key={user?.uid ?? "visitor"}/>; }
