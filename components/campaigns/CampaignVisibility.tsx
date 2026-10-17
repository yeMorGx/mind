"use client";
import { useEffect, useState, type ReactNode } from "react";
export default function CampaignVisibility({
  endsAt,
  preview,
  children,
}: {
  endsAt: string | null;
  preview: boolean;
  children: ReactNode;
}) {
  const [expired, setExpired] = useState<string | null>(null);
  useEffect(() => {
    if (preview || !endsAt) return;
    const end = Date.parse(endsAt);
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      const remaining = end - Date.now();
      if (remaining <= 0) {
        setExpired(endsAt);
        return;
      }
      timer = setTimeout(check, Math.min(remaining, 2147483000));
    };
    // The deadline is also rechecked when a suspended tab becomes visible.
    timer = setTimeout(check, 0);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [endsAt, preview]);
  return endsAt !== null && expired === endsAt && !preview ? null : children;
}
