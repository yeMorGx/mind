"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CampaignCoupon({ code }: { code?: string }) {
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
          <span>Cupom de desconto</span>
          <code>{code.trim()}</code>
        </div>
        <button type="button" onClick={copy} aria-label={`Copiar cupom ${code.trim()}`}>
          {state === "copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          <span>{state === "copied" ? "Copiado" : "Copiar"}</span>
        </button>
      </div>
      <span role="status" className={state === "error" ? "campaign-coupon-error" : "sr-only"}>
        {state === "copied" ? "Cupom copiado." : state === "error" ? "Não foi possível copiar. Selecione o código acima e copie manualmente." : ""}
      </span>
    </div>
  );
}
