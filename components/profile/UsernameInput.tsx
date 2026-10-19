"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useId, useRef, useState } from "react";
import { isUsernameAvailable } from "@/lib/supabase/creators";
import { normalizeUsername, USERNAME_HINT, USERNAME_PATTERN } from "@/lib/usernames";
export default function UsernameInput({ value, onChange, publicId, disabled = false, autoFocus = false }: { value: string; onChange: (value: string) => void; publicId: string; disabled?: boolean; autoFocus?: boolean }) {
 const { t } = useI18n();

  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const username = normalizeUsername(value);
  const key = `${publicId}:${username}`;
  const valid = USERNAME_PATTERN.test(username);
  const [result, setResult] = useState<{ key: string; status: "available" | "taken" | "error" } | null>(null);
  useEffect(() => {
    if (!valid) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      void isUsernameAvailable(username,publicId).then(available => { if (alive) setResult({ key,status:available ? "available" : "taken" }); }).catch(() => { if (alive) setResult({ key,status:"error" }); });
    }, 300);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [username, publicId, key, valid]);
  const status = result?.key === key ? result.status : "checking";
  useEffect(() => { input.current?.setCustomValidity(valid && status === "taken" ? "Este @ já está em uso. Escolha outro." : ""); }, [valid,status]);
  return <div>
    <label htmlFor={id} className="block text-sm font-medium">{t("Seu @")}</label>
    <div className="relative mt-2"><span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">@</span>
      <input id={id} ref={input} name="username" required pattern="[a-z][a-z0-9_]{2,23}" minLength={3} maxLength={24} value={value} onChange={event => onChange(normalizeUsername(event.target.value))} disabled={disabled} autoFocus={autoFocus} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={t("seu_nome")} aria-describedby={`${id}-hint ${id}-availability`} aria-invalid={Boolean(value) && (!valid || status === "taken")}
        className="block w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm outline-none focus:border-foreground disabled:opacity-50" />
    </div>
    <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-muted">{USERNAME_HINT}</p>
    <p id={`${id}-availability`} role="status" className={`mt-1 min-h-5 text-xs leading-5 ${valid && status === "available" ? "text-emerald-700" : status === "taken" || value && !valid ? "text-red-700" : "text-muted"}`}>
      {!value ? t("Este será seu identificador único no Mind.") : !valid ? t("Confira o formato do @.") : status === "checking" ? t("Verificando disponibilidade…") : status === "available" ? t("@ disponível para sua conta.") : status === "taken" ? t("Este @ já está em uso. Escolha outro.") : t("Não foi possível conferir agora. A disponibilidade será validada ao salvar.")}
    </p>
  </div>;
}
