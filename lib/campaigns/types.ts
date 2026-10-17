export type CampaignPlacement = "hero" | "prompts" | "mcps" | "markdown";
export const CAMPAIGN_PLACEMENTS: Record<CampaignPlacement, string> = {
  prompts: "Cards de prompts",
  mcps: "Cards de MCPs",
  markdown: "Cards de Markdown",
  hero: "Hero do Explorar",
};
export type CampaignSlots = {
  hero: PublicCampaign | null;
  card: PublicCampaign | null;
};
export type CampaignKind = "affiliate" | "sponsored";
export type CampaignStatus = "draft" | "active" | "paused" | "archived";
export type PublicCampaign = {
  id: string;
  placements: CampaignPlacement[];
  kind: CampaignKind;
  advertiser: string;
  title: string;
  description: string;
  logo_url: string;
  image_url: string;
  image_alt: string;
  video_url: string;
  cta_label: string;
  target_url: string;
  starts_at: string | null;
  ends_at: string | null;
};
export type Campaign = PublicCampaign & {
  name: string;
  status: CampaignStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  views: number;
  clicks: number;
};
export type CampaignDraft = Omit<PublicCampaign, "id"> & { name: string };
export const PUBLIC_CAMPAIGN_FIELDS =
  "id,placements,kind,advertiser,title,description,logo_url,image_url,image_alt,video_url,cta_label,target_url,starts_at,ends_at";
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function campaignState(
  campaign: Pick<Campaign, "status" | "starts_at" | "ends_at">,
  now = Date.now(),
) {
  if (campaign.status !== "active")
    return { draft: "Rascunho", paused: "Pausada", archived: "Arquivada" }[
      campaign.status
    ];
  if (campaign.ends_at && new Date(campaign.ends_at).getTime() <= now)
    return "Encerrada";
  if (campaign.starts_at && new Date(campaign.starts_at).getTime() > now)
    return "Agendada";
  return "No ar";
}
/** Only HTTPS or known public Mind destinations; credentials, fragments-only and protocol-relative URLs are rejected. */
export function campaignDestination(raw: string): string | null {
  if (/^\/(p|resources|u)\/[A-Za-z0-9_~-]+$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".local") ||
      /^[\d.]+$/.test(url.hostname) ||
      url.hostname.includes(":")
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export function campaignMedia(raw: string): string | null {
  if (!raw) return "";
  const url = campaignDestination(raw);
  return url?.startsWith("https://") ? url : null;
}
