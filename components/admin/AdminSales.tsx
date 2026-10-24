"use client";
/* eslint-disable @next/next/no-img-element -- profile avatars may be hosted by Google or creator storage. */
import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, BadgeDollarSign, CircleDollarSign, Gift, LoaderCircle, RefreshCw, Search, Users } from "lucide-react";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import type { MindUser } from "@/lib/backend";
import type { BadgeKind } from "@/lib/badges";
import { adminRequest, AdminRequestError } from "@/lib/admin/client";
import CreatorBadges from "@/components/ui/CreatorBadges";
import { SelectField } from "@/components/ui/SelectField";

type Person = { public_id: string; name: string; username: string | null; avatar?: string | null; badges: BadgeKind[]; plan: string };
type Subscription = { public_id: string; name: string; username: string | null; avatar: string | null; badges: BadgeKind[]; plan: string; status: string; period_end: string | null; cancel_at_period_end: boolean; updated_at: string };
type Grant = { public_id: string; name: string; username: string | null; avatar: string | null; badges: BadgeKind[]; plan: string; reason: string; granted_at: string; expires_at: string | null; active: boolean };
type Payment = { id: string; number: string | null; customer: string; email: string | null; plan: string; amountPaid: number; currency: string; createdAt: string; invoiceUrl: string | null };
type SalesData = {
 summary: { activeSubscriptions: number; activeManualGrants: number };
 subscriptions: Subscription[];
 grants: Grant[];
 stripe: { connected: boolean; error: boolean; periodStart: string; paidInvoiceCount: number; revenueComplete: boolean; revenue: Array<{ currency: string; amountPaid: number }>; payments: Payment[] };
};

const periodOptions = [
 { value: "30d", label: "Últimos 30 dias" },
 { value: "month", label: "Este mês" },
 { value: "90d", label: "Últimos 90 dias" },
];
const expiryOptions = [
 { value: "never", label: "Sem expiração" },
 { value: "30d", label: "30 dias" },
 { value: "90d", label: "90 dias" },
 { value: "1y", label: "1 ano" },
 { value: "custom", label: "Escolher data" },
];

function localDateValue(date = new Date()) {
 const offset = date.getTimezoneOffset() * 60_000;
 return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function AdminSales({ user }: { user: MindUser }) {
 const { t, intlLocale } = useI18n();
 const [period, setPeriod] = useState("30d");
 const [data, setData] = useState<SalesData | null>(null);
 const [loadedRequest, setLoadedRequest] = useState("");
 const [error, setError] = useState("");
 const [refreshVersion, setRefreshVersion] = useState(0);
 const [query, setQuery] = useState("");
 const [results, setResults] = useState<Person[]>([]);
 const [searched, setSearched] = useState(false);
 const [searching, setSearching] = useState(false);
 const [target, setTarget] = useState<Person | null>(null);
 const [mode, setMode] = useState<"grant" | "revoke">("grant");
 const [expiry, setExpiry] = useState("never");
 const [customDate, setCustomDate] = useState("");
 const [reason, setReason] = useState("");
 const [pending, setPending] = useState(false);
 const [notice, setNotice] = useState("");
 const requestKey = `${period}:${refreshVersion}`;
 const loading = loadedRequest !== requestKey;

 useEffect(() => {
  let alive = true;
  adminRequest<SalesData>(user, "sales", { period }).then(value => {
   if (alive) { setData(value); setError(""); }
  }).catch(failure => {
   if (alive) setError(failure instanceof AdminRequestError ? failure.message : t("Não foi possível carregar vendas e planos."));
  }).finally(() => {
   if (alive) setLoadedRequest(requestKey);
  });
  return () => { alive = false; };
 }, [user, period, refreshVersion, requestKey, t]);

 async function searchPeople(event: FormEvent) {
  event.preventDefault();
  setSearching(true); setError(""); setNotice("");
  try {
   const result = await adminRequest<{ items: Person[] }>(user, "users", { search: query.trim(), page: 0 });
   setResults(result.items); setSearched(true);
  } catch (failure) {
   setError(failure instanceof Error ? failure.message : t("Não foi possível buscar contas."));
  } finally { setSearching(false); }
 }

 async function saveGrant(event: FormEvent) {
  event.preventDefault();
  if (!target || pending) return;
  setPending(true); setNotice(""); setError("");
  try {
   if (mode === "grant") {
    let expiresAt: string | null = null;
    if (expiry === "30d" || expiry === "90d" || expiry === "1y") {
     const days = expiry === "30d" ? 30 : expiry === "90d" ? 90 : 365;
     expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    } else if (expiry === "custom") {
     if (!customDate) throw new Error(t("Escolha a data em que a concessão termina."));
     const date = new Date(`${customDate}T23:59:59.999`);
     if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error(t("A data de validade precisa estar no futuro."));
     expiresAt = date.toISOString();
    }
    await adminRequest(user, "grant-premium", { target: target.public_id, expiresAt, reason });
    setNotice(t("Premium concedido manualmente."));
   } else {
    await adminRequest(user, "revoke-premium", { target: target.public_id, reason });
    setNotice(t("Concessão manual removida. Uma assinatura ativa do Stripe continua válida."));
   }
   setTarget(null); setResults([]); setReason(""); setCustomDate(""); setExpiry("never"); setMode("grant");
   setRefreshVersion(value => value + 1);
  } catch (failure) {
   setError(failure instanceof Error ? failure.message : t("Não foi possível salvar a concessão."));
  } finally { setPending(false); }
 }

 const formatDate = (value: string | null, fallback = "—") => value ? new Date(value).toLocaleString(intlLocale, { dateStyle: "medium", timeStyle: "short" }) : fallback;
 const formatCurrency = (minorAmount: number, currency: string) => {
  try {
   const code = currency.toUpperCase();
   const fractionDigits = new Intl.NumberFormat(intlLocale, { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits ?? 2;
   return new Intl.NumberFormat(intlLocale, { style: "currency", currency: code }).format(minorAmount / (10 ** fractionDigits));
  } catch { return `${currency.toUpperCase()} ${minorAmount}`; }
 };
 const activeGrant = target && data?.grants.find(grant => grant.public_id === target.public_id);

 return <main className="admin-sales" aria-busy={loading}>
  <header className="admin-sales-heading">
   <div><h2>{t("Vendas e planos")}</h2><p>{t("Acompanhe as assinaturas pagas e as concessões manuais sem misturar as duas origens.")}</p></div>
   <div className="admin-sales-period"><SelectField label={t("Período das vendas")} name="sales-period" value={period} onValueChange={setPeriod} options={periodOptions}/><button className="workflow-button secondary" type="button" onClick={() => setRefreshVersion(value => value + 1)} disabled={loading} aria-label={t("Atualizar vendas e planos")}><RefreshCw size={18} aria-hidden="true"/>{t("Atualizar")}</button></div>
  </header>
  {error && <p className="admin-sales-alert" role="alert">{error}</p>}
  {notice && <p className="admin-sales-notice" role="status">{notice}</p>}
  {loading && !data ? <div className="admin-sales-loading" role="status"><LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true"/>{t("Carregando vendas e planos…")}</div> : data && <>
   <dl className="admin-metrics admin-sales-metrics">
    <div><dt><CircleDollarSign size={18} aria-hidden="true"/>{t("Receita de faturas pagas")}</dt><dd>{data.stripe.revenue.length ? data.stripe.revenue.map(item => formatCurrency(item.amountPaid, item.currency)).join(" · ") : "—"}</dd></div>
    <div><dt><BadgeDollarSign size={18} aria-hidden="true"/>{t("Faturas pagas criadas no período")}</dt><dd>{data.stripe.connected ? data.stripe.paidInvoiceCount.toLocaleString(intlLocale) : "—"}</dd></div>
    <div><dt><Users size={18} aria-hidden="true"/>{t("Assinaturas ativas")}</dt><dd>{data.summary.activeSubscriptions.toLocaleString(intlLocale)}</dd></div>
    <div><dt><Gift size={18} aria-hidden="true"/>{t("Premium manual ativo")}</dt><dd>{data.summary.activeManualGrants.toLocaleString(intlLocale)}</dd></div>
   </dl>
   {!data.stripe.connected && <p className="admin-sales-muted" role="status">{data.stripe.error ? t("O Stripe não respondeu. Concessões e assinaturas do Mind continuam disponíveis.") : t("O Stripe ainda não está conectado; as métricas de pagamentos estão indisponíveis.")}</p>}
   {data.stripe.connected && !data.stripe.revenueComplete && <p className="admin-sales-muted" role="status">{t("O relatório atingiu o limite de páginas e pode não incluir todas as faturas deste período.")}</p>}

   <section className="admin-sales-section">
    <h3>{t("Pagamentos recentes")}</h3>
    <p className="admin-sales-muted">{t("Valores pagos em faturas de assinaturas Mind criadas desde {v0}.", { v0: formatDate(data.stripe.periodStart) })}</p>
    <div className="admin-table-wrap"><table><thead><tr><th>{t("Cliente")}</th><th>{t("Plano")}</th><th>{t("Valor recebido")}</th><th>{t("Criada em")}</th><th>{t("Fatura")}</th></tr></thead><tbody>
     {data.stripe.payments.map(payment => <tr key={payment.id}><td><strong>{payment.customer}</strong>{payment.email && <small className="admin-sales-email">{payment.email}</small>}</td><td>{t(payment.plan === "premium" ? "Premium" : payment.plan === "plus" ? "Plus" : payment.plan)}</td><td>{formatCurrency(payment.amountPaid, payment.currency)}</td><td>{formatDate(payment.createdAt)}</td><td>{payment.invoiceUrl ? <a className="admin-sales-link" href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer" aria-label={t("Abrir fatura {v0}", { v0: payment.number || payment.id })}><ArrowUpRight size={18} aria-hidden="true"/>{payment.number || t("Abrir")}</a> : payment.number || "—"}</td></tr>)}
    </tbody></table></div>
    {data.stripe.connected && data.stripe.payments.length === 0 && <p className="admin-sales-empty">{t("Não há faturas pagas de assinaturas Mind neste período.")}</p>}
   </section>

   <section className="admin-sales-section">
    <h3>{t("Clientes com assinatura Stripe")}</h3>
    <div className="admin-table-wrap"><table><thead><tr><th>{t("Pessoa")}</th><th>{t("Plano")}</th><th>{t("Status")}</th><th>{t("Fim do período")}</th><th>{t("Atualizado")}</th></tr></thead><tbody>
     {data.subscriptions.map(subscription => <tr key={subscription.public_id}><td><AdminSalesPerson publicId={subscription.public_id} name={subscription.name} username={subscription.username} avatar={subscription.avatar} badges={subscription.badges}/></td><td>{t(subscription.plan === "premium" ? "Premium" : subscription.plan === "plus" ? "Plus" : subscription.plan)}</td><td><span className="admin-sales-status" data-active={subscription.status === "active" || subscription.status === "trialing" || undefined}>{t(subscription.status)}{subscription.cancel_at_period_end ? ` · ${t("Cancela no fim do período")}` : ""}</span></td><td>{formatDate(subscription.period_end)}</td><td>{formatDate(subscription.updated_at)}</td></tr>)}
    </tbody></table></div>
    {!data.subscriptions.length && <p className="admin-sales-empty">{t("Nenhuma assinatura Stripe foi registrada ainda.")}</p>}
   </section>

   <section className="admin-sales-section">
    <h3>{t("Concessões manuais de Premium")}</h3>
    <p className="admin-sales-muted">{t("Essas concessões não são vendas e podem ter validade ou acesso permanente.")}</p>
    <div className="admin-table-wrap"><table><thead><tr><th>{t("Pessoa")}</th><th>{t("Concedido em")}</th><th>{t("Validade")}</th><th>{t("Motivo")}</th><th>{t("Ação")}</th></tr></thead><tbody>
     {data.grants.map(grant => <tr key={grant.public_id}><td><AdminSalesPerson publicId={grant.public_id} name={grant.name} username={grant.username} avatar={grant.avatar} badges={grant.badges}/></td><td>{formatDate(grant.granted_at)}</td><td>{grant.active ? formatDate(grant.expires_at,t("Acesso permanente")) : t("Expirado")}</td><td>{grant.reason}</td><td><button className="workflow-button secondary" type="button" onClick={() => {setTarget({ public_id:grant.public_id,name:grant.name,username:grant.username,avatar:grant.avatar,badges:grant.badges,plan:"premium" });setMode("revoke");setReason("");setError("");setNotice("");}} disabled={pending}>{t("Remover")}</button></td></tr>)}
    </tbody></table></div>
    {!data.grants.length && <p className="admin-sales-empty">{t("Nenhuma concessão manual registrada ainda.")}</p>}
   </section>

   <section className="admin-sales-section admin-sales-grant">
    <h3>{t("Conceder Premium a uma pessoa")}</h3>
    <p className="admin-sales-muted">{t("A concessão fica registrada no histórico administrativo e não cria uma cobrança no Stripe.")}</p>
    <form className="admin-search" onSubmit={searchPeople}>
     <label>{t("Buscar uma conta por nome ou @")}<input value={query} maxLength={80} onChange={event => {setQuery(event.target.value);setSearched(false);setResults([]);}} placeholder={t("Digite nome ou @")}/></label>
     <button className="workflow-button" disabled={searching || !query.trim()}><Search size={18} aria-hidden="true"/>{searching ? t("Buscando…") : t("Buscar")}</button>
    </form>
    {results.length > 0 && <div className="admin-sales-search-results" aria-label={t("Resultados da busca")}>
     {results.map(person => <button type="button" className="admin-sales-result" key={person.public_id} onClick={() => {setTarget(person);setMode("grant");setExpiry("never");setReason("");setError("");setNotice("");setResults([]);}}><AdminSalesPerson publicId={person.public_id} name={person.name} username={person.username} avatar={person.avatar} badges={person.badges}/><span>{t(person.plan === "premium" ? "Premium" : person.plan === "plus" ? "Plus" : "Free")}</span></button>)}
    </div>}
    {searched && results.length === 0 && !searching && !error && <p className="admin-sales-empty">{t("Nenhuma conta corresponde à busca.")}</p>}
    {target && <form className="admin-sales-grant-form" onSubmit={saveGrant}>
     <div className="admin-sales-selected"><span>{t(mode === "grant" ? "Conceder Premium a" : "Remover concessão de")}</span><AdminSalesPerson publicId={target.public_id} name={target.name} username={target.username} avatar={target.avatar} badges={target.badges}/></div>
     {mode === "grant" ? <>
      {activeGrant && <p className="admin-sales-muted">{t("Esta conta já possui uma concessão manual; salvar vai atualizar validade e motivo.")}</p>}
      <SelectField label={t("Validade da concessão")} name="grant-expiry" value={expiry} onValueChange={setExpiry} options={expiryOptions}/>
      {expiry === "custom" && <label>{t("Conceder até")}<input type="date" min={localDateValue()} value={customDate} onChange={event => setCustomDate(event.target.value)} required/></label>}
      <p className="admin-sales-muted">{t("A assinatura paga da pessoa no Stripe não será alterada.")}</p>
     </> : <p className="admin-sales-muted">{t("Remover esta concessão não cancela uma assinatura paga ativa.")}</p>}
     <label>{t(mode === "grant" ? "Motivo da concessão" : "Motivo da revogação")}<textarea minLength={5} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} placeholder={t(mode === "grant" ? "Explique por que está concedendo Premium." : "Explique por que está removendo esta concessão.")} required/></label>
     <div className="admin-sales-actions"><button className="workflow-button" disabled={pending || reason.trim().length < 5}>{pending ? t("Salvando…") : t(mode === "grant" ? "Aplicar Premium" : "Revogar concessão")}</button><button className="workflow-button secondary" type="button" disabled={pending} onClick={() => setTarget(null)}>{t("Cancelar")}</button></div>
    </form>}
   </section>
  </>}
 </main>;
}

function AdminSalesPerson({ publicId, name, username, avatar, badges }: { publicId: string; name: string; username: string | null; avatar?: string | null; badges: BadgeKind[] }) {
 return <span className="admin-sales-person">
  <span className="admin-sales-person-avatar">{avatar ? <img src={avatar} alt=""/> : <Users size={18} aria-hidden="true"/>}</span>
  <span className="admin-sales-person-copy"><a href={`https://www.mindapp.icu/u/${encodeURIComponent(publicId)}`} target="_blank" rel="noopener noreferrer">{name}</a>{username && <small>@{username}</small>}</span>
  <CreatorBadges badges={badges} compact/>
 </span>;
}
