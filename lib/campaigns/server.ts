import "server-only";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_CAMPAIGN_FIELDS,
  type PublicCampaign,
  type CampaignPlacement,
  type CampaignSlots,
  CAMPAIGN_PLACEMENTS,
} from "./types";
import { ServiceError } from "@/lib/billing/server";
import {
  campaignDestination,
  campaignMedia,
  type CampaignDraft,
} from "./types";
export async function getCampaignSlots(
  placement: Exclude<CampaignPlacement, "hero">,
): Promise<CampaignSlots> {
  const empty = { hero: null, card: null };
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return empty;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, init) =>
          fetch(url, {
            ...init,
            cache: "no-store",
            signal: AbortSignal.timeout(3500),
          }),
      },
    });
    // RLS restricts this public projection to campaigns within their active schedule.
    const { data, error } = await client
      .from("mind_campaigns")
      .select(PUBLIC_CAMPAIGN_FIELDS)
      .overlaps(
        "placements",
        placement === "prompts" ? ["hero", placement] : [placement],
      )
      .limit(100);
    if (error || !data?.length) return empty;
    const rows = data as PublicCampaign[];
    // One campaign per catalog page. A campaign eligible for both positions alternates placement across visits.
    const chosen = rows[randomInt(rows.length)];
    const hero = placement === "prompts" && chosen.placements.includes("hero");
    const card = chosen.placements.includes(placement);
    if (hero && (!card || randomInt(2) === 0))
      return { hero: chosen, card: null };
    return { hero: null, card: chosen };
  } catch {
    return empty;
  }
}
export function sanitizeCampaign(raw: unknown, status: string): CampaignDraft {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ServiceError("Confira os dados da campanha.");
  const value = raw as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const v = value[key];
    if (typeof v !== "string" || v.length > max)
      throw new ServiceError("Confira os campos e os limites de texto.");
    return v.trim();
  };
  const placements = Array.isArray(value.placements)
    ? [...new Set(value.placements)]
    : [];
  if (
    placements.length > 4 ||
    placements.some(
      (p) => typeof p !== "string" || !Object.hasOwn(CAMPAIGN_PLACEMENTS, p),
    ) ||
    (status === "active" && !placements.length)
  )
    throw new ServiceError("Escolha onde a divulgação deve aparecer.");
  const name = text("name", 100),
    advertiser = text("advertiser", 80),
    title = text("title", 96),
    description = text("description", 220),
    cta_label = text("cta_label", 32),
    image_alt = text("image_alt", 160);
  if (name.length < 2)
    throw new ServiceError("Dê um nome à campanha para encontrá-la depois.");
  if (!["affiliate", "sponsored"].includes(String(value.kind)))
    throw new ServiceError("Escolha afiliado ou parceria paga.");
  const target = text("target_url", 2048),
    target_url = target ? campaignDestination(target) : "";
  const logo_url = campaignMedia(text("logo_url", 2048)),
    image_url = campaignMedia(text("image_url", 2048)),
    video_url = campaignMedia(text("video_url", 2048));
  if (
    target_url === null ||
    logo_url === null ||
    image_url === null ||
    video_url === null
  )
    throw new ServiceError(
      "Use links HTTPS válidos. O destino também pode ser uma página pública do Mind.",
    );
  const date = (key: string) => {
    if (value[key] === null || value[key] === "") return null;
    const v = value[key];
    if (
      typeof v !== "string" ||
      v.length > 40 ||
      !Number.isFinite(Date.parse(v))
    )
      throw new ServiceError("Confira as datas da divulgação.");
    return new Date(v).toISOString();
  };
  const starts_at = date("starts_at"),
    ends_at = date("ends_at");
  if (ends_at && (!starts_at || Date.parse(ends_at) <= Date.parse(starts_at)))
    throw new ServiceError("O fim precisa ser depois do início.");
  if (
    status === "active" &&
    (!advertiser ||
      !title ||
      !description ||
      !cta_label ||
      !target_url ||
      !image_url ||
      !image_alt ||
      !starts_at)
  )
    throw new ServiceError(
      "Preencha anunciante, título, descrição, capa, descrição da imagem, botão, destino e início antes de ativar.",
    );
  if (status === "active" && ends_at && Date.parse(ends_at) <= Date.now())
    throw new ServiceError("Escolha uma data final que ainda não passou.");
  return {
    placements: placements as CampaignPlacement[],
    name,
    advertiser,
    title,
    description,
    cta_label,
    image_alt,
    target_url,
    logo_url,
    image_url,
    video_url,
    starts_at,
    ends_at,
    kind: value.kind as CampaignDraft["kind"],
  };
}
