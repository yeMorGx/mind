"use client";
import CreatorIdentity from "./CreatorIdentity";
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
    {!current ? <p role="status" className="py-5 text-sm text-muted">Buscando pessoas…</p> : current.error ? <div role="alert" className="py-5 text-sm"><p>Não foi possível buscar pessoas.</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-2 underline underline-offset-4">Tentar novamente</button></div> : current.items.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{current.items.map(person => <div key={person.public_id} className="min-w-0 rounded-2xl bg-surface p-4"><CreatorIdentity name={person.name} username={person.username} avatarUrl={person.avatar_url} badges={person.badges} href={creatorProfileHref(person.public_id,person.username)}/>{person.headline&&<p className="mt-2 text-xs text-muted">{person.headline}</p>}</div>)}</div> : <div className="catalog-empty"><h2>{query.trim() ? "Nenhuma pessoa encontrada." : "Os criadores estão chegando."}</h2><p>{query.trim() ? "Busque pelo nome ou pelo @ da pessoa." : "Os perfis aparecem aqui assim que escolhem seu @."}</p></div>}
  </section>;
}
