"use client";
import { useEffect, useRef, type RefObject } from "react";
let memoryVisit: string | undefined;
function visitId() {
  try {
    const key = "mind:campaign-visit";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return memoryVisit ?? (memoryVisit = crypto.randomUUID());
  }
}
export function trackCampaignEvent(id: string, kind: "view" | "click") {
  void fetch("/api/campaigns/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, kind, visit: visitId() }),
    keepalive: true,
    cache: "no-store",
  }).catch(() => {});
}
export function useCampaignExposure(
  id: string,
  preview: boolean,
  media: RefObject<HTMLVideoElement | null>,
) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (preview || !root.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined,
      counted = false,
      visible = false;
    const clear = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      clear();
      if (document.visibilityState === "hidden") media.current?.pause();
      if (visible && document.visibilityState !== "hidden" && !counted)
        timer = setTimeout(() => {
          counted = true;
          trackCampaignEvent(id, "view");
        }, 1000);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        schedule();
        if (!visible) media.current?.pause();
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(root.current);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      observer.disconnect();
      clear();
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [id, preview, media]);
  return root;
}
