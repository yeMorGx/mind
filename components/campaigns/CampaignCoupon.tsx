"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CampaignCoupon({ code }: { code?: string }) {
 const { t } = useI18n();

  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  if (!code?.trim()) return null;

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(code!.trim());
      setState("copied");
    } catch {
      setState("error");
    }
    timer.current = setTimeout(() => setState("idle"), 3500);
  }

  return (
    <div className="campaign-coupon">
      <div className="campaign-coupon-ticket">
        <div className="campaign-coupon-code">
          <span>{t("Cupom de desconto")}</span>
          <code>{code.trim()}</code>
        </div>
        <button type="button" onClick={copy} aria-label={t("Copiar cupom {v0}", {v0: (code.trim())})}>
          {state === "copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          <span>{state === "copied" ? t("Copiado") : t("Copiar")}</span>
        </button>
      </div>
      <span role="status" className={state === "error" ? "campaign-coupon-error" : "sr-only"}>
        {state === "copied" ? t("Cupom copiado.") : state === "error" ? t("Não foi possível copiar. Selecione o código acima e copie manualmente.") : ""}
      </span>
    </div>
  );
}
