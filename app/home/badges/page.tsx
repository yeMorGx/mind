"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {AnimatedCheckbox} from "@/components/ui/animated-checkbox";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { assignAccountBadges, badgeInfo, getAccountBadges, type BadgeKind } from "@/lib/firebase/badges";
import CreatorBadges from "@/components/ui/CreatorBadges";
export default function BadgesPage() {
 const { t } = useI18n();

  const { user, authReady } = useOnboarding();
  const [allowed, setAllowed] = useState(false);
  const [uid, setUid] = useState("");
  const [badges, setBadges] = useState<BadgeKind[]>([]);
  const [loadedUid, setLoadedUid] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => { let alive = true; user?.getIdTokenResult().then(result => { if (alive) setAllowed(result.claims.badgeAdmin === true); }).catch(() => {}); return () => { alive = false; }; }, [user]);
  async function load() {
    if (!user || !allowed || !uid.trim() || uid.includes("/")) return;
    setPending(true); setMessage("");
    try { const values = await getAccountBadges(uid.trim()); setBadges(values); setLoadedUid(uid.trim()); }
    catch { setMessage(t("Não foi possível carregar os emblemas.")); }
    finally { setPending(false); }
  }
  async function save() {
    if (!user || !allowed || loadedUid !== uid.trim()) return;
    setPending(true); setMessage("");
    try { await assignAccountBadges(uid, badges); setMessage(t("Emblemas atualizados.")); }
    catch (error) { setMessage(error instanceof Error ? error.message : t("Não foi possível atualizar os emblemas.")); }
    finally { setPending(false); }
  }
  return <main className="min-h-[calc(100dvh-4.5rem)] bg-background px-5 py-12 text-foreground"><div className="mx-auto max-w-2xl"><Link href="/home" className="text-sm text-muted">{t("Voltar à biblioteca")}</Link><h1 className="mt-8 text-3xl font-semibold">{t("Emblemas da comunidade")}</h1>
    {!authReady ? <p className="mt-6">{t("Carregando…")}</p> : !user || !allowed ? <p className="mt-6 text-muted">{t("Esta área exige permissão administrativa para atribuir emblemas.")}</p> : <div className="mt-8 space-y-5">
      <label className="block text-sm">{t("UID da conta")}<input value={uid} onChange={event => { setUid(event.target.value); setLoadedUid(""); }} className="mt-2 block w-full rounded-xl border border-border bg-foreground/5 p-3" /></label>
      <button disabled={pending} type="button" onClick={() => void load()} className="rounded-xl border border-border px-5 py-3 disabled:opacity-40">{t("Carregar conta")}</button>
      {loadedUid === uid.trim() && loadedUid && <><CreatorBadges badges={badges} labeled />
        {badges.includes("owner") ? <p className="text-muted">{t("O selo e as permissões do fundador são gerenciados exclusivamente no servidor.")}</p> : <>
          {(["verified", "moderator", "creator", "partner"] as BadgeKind[]).map(kind => <AnimatedCheckbox key={kind} className="rounded-xl border border-border p-4" checked={badges.includes(kind)} onChange={event => setBadges(values => event.target.checked ? [...values, kind] : values.filter(value => value !== kind))}><span><span className="block font-medium">{badgeInfo[kind].label}</span><span className="mt-1 block text-sm text-muted">{badgeInfo[kind].description}</span></span></AnimatedCheckbox>)}
          <button disabled={pending} type="button" onClick={() => void save()} className="rounded-xl bg-primary px-5 py-3 text-primary-foreground disabled:opacity-40">{pending ? t("Salvando…") : t("Salvar emblemas")}</button>
        </>}
      </>}
    </div>}
    {message && <p className="mt-5 text-sm text-muted" role="status">{t(message)}</p>}
  </div></main>;
}
