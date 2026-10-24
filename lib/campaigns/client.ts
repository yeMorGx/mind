"use client";
import type { MindUser } from "@/lib/backend";
import { accountHeaders } from "@/lib/billing/client";
import { requireSupabaseClient } from "@/lib/supabase/client";
export async function campaignRequest<T>(
  user: MindUser,
  action: "list" | "save" | "state",
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`/api/campaigns/${action}`, {
    method: "POST",
    headers: {
      ...(await accountHeaders(user)),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const value = await response.json();
  if (!response.ok && value.code === "admin_mfa_required") window.dispatchEvent(new Event("mind:admin-mfa"));
  if (!response.ok)
    throw new Error(value.error || "Não foi possível carregar as campanhas.");
  return value;
}

const campaignImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const campaignVideoTypes = new Set(["video/mp4", "video/webm"]);

export async function uploadCampaignMedia(user: MindUser, file: File) {
  const isImage = campaignImageTypes.has(file.type);
  const isVideo = campaignVideoTypes.has(file.type);
  const maxSize = isVideo ? 30 * 1024 * 1024 : 8 * 1024 * 1024;
  if ((!isImage && !isVideo) || !file.size || file.size > maxSize)
    throw new Error(
      isVideo
        ? "Escolha um vídeo MP4 ou WebM de até 30 MB."
        : "Escolha uma imagem JPG, PNG, WebP ou AVIF de até 8 MB.",
    );

  const response = await fetch("/api/campaigns/media", {
    method: "POST",
    headers: {
      ...(await accountHeaders(user)),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: file.type, size: file.size }),
    cache: "no-store",
  });
  const value = await response.json();
  if (!response.ok && value.code === "admin_mfa_required") window.dispatchEvent(new Event("mind:admin-mfa"));
  if (!response.ok || !value.path || !value.token || !value.publicUrl)
    throw new Error(value.error || "Não foi possível preparar o envio.");

  const result = await requireSupabaseClient()
    .storage.from("mind-campaign-assets")
    .uploadToSignedUrl(value.path, value.token, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
  if (result.error) throw new Error("Não foi possível enviar o arquivo. Tente novamente.");
  return value.publicUrl as string;
}
