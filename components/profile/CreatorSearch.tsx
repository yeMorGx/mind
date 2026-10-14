"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { searchCreators, type CreatorSearchResult } from "@/lib/supabase/creators";
import { creatorProfileHref } from "@/lib/usernames";
export default function CreatorSearch({ query, compact = false }: { query: string; compact?: boolean }) {
  const [result, setResult] = useState<{ query: string; items: CreatorSearchResult[]; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (compact && !query.trim()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchCreators(query,controller.signal).then(items => { if (!controller.signal.aborted) setResult({ query,items,error:false }); }).catch(() => { if (!controller.signal.aborted) setResult({ query,items:[],error:true }); });
    },250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  },[query,compact,attempt]);
  if (compact && !query.trim()) return null;
  const current = result?.query === query ? result : null;
  if (compact && current && !current.error && !current.items.length) return null;
  return <section className="mb-7" aria-label="Criadores">
    {compact && <h2 className="mb-3 text-sm font-semibold">Pessoas encontradas</h2>}
    {!current ? <p role="status" className="py-5 text-sm text-muted">Buscando pessoas…</p> : current.error ? <div role="alert" className="py-5 text-sm"><p>Não foi possível buscar pessoas.</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-2 underline underline-offset-4">Tentar novamente</button></div> : current.items.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{current.items.map(person => <Link key={person.public_id} href={creatorProfileHref(person.public_id,person.username)} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-hover">
      {/* eslint-disable-next-line @next/next/no-img-element -- Public creator avatars can be optimized data URLs. */}
      {person.avatar_url ? <img src={person.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background font-medium" aria-hidden="true">{person.name?.slice(0,1).toUpperCase() || "@"}</span>}
      <div className="min-w-0"><h3 className="truncate text-sm font-semibold">{person.name}</h3><p className="truncate text-sm text-muted">@{person.username}</p>{person.headline && <p className="mt-1 truncate text-xs text-muted">{person.headline}</p>}</div>
    </Link>)}</div> : <div className="catalog-empty"><h2>{query.trim() ? "Nenhuma pessoa encontrada." : "Os criadores estão chegando."}</h2><p>{query.trim() ? "Busque pelo nome ou pelo @ da pessoa." : "Os perfis aparecem aqui assim que escolhem seu @."}</p></div>}
  </section>;
}
