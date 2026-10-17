import { createHmac } from "node:crypto";
import {
  adminClient,
  apiError,
  assertOrigin,
  databaseError,
  identity,
  isOwner,
  noStore,
  readBody,
  ServiceError,
} from "@/lib/billing/server";
import { sanitizeCampaign } from "@/lib/campaigns/server";
import { UUID } from "@/lib/campaigns/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
export async function POST(request: Request, context: Context) {
  try {
    assertOrigin(request);
    const { action } = await context.params;
    if (action === "event") {
      const body = await readBody(request, 2000);
      if (
        typeof body.id !== "string" ||
        !UUID.test(body.id) ||
        typeof body.visit !== "string" ||
        !UUID.test(body.visit) ||
        !["view", "click"].includes(String(body.kind))
      )
        throw new ServiceError("Evento inválido.");
      const admin = adminClient(),
        secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const day = new Date().toISOString().slice(0, 10);
      // Vercel's trusted forwarding header is not stored; salt rotates daily and never reaches clients.
      const ip = (request.headers.get("x-vercel-forwarded-for") || "unknown")
        .split(",")[0]
        .trim()
        .slice(0, 100);
      const hash = (s: string) =>
        createHmac("sha256", secret).update(`${day}:${s}`).digest("hex");
      const result = await admin.rpc("mind_campaign_record_event", {
        campaign: body.id,
        event_kind: body.kind,
        visitor_hash: hash(body.visit),
        address_hash: hash(ip),
      });
      databaseError(result.error);
      return Response.json({ received: true }, { headers: noStore });
    }
    if (!["list", "save", "state"].includes(action))
      throw new ServiceError("Ação não encontrada.", 404);
    const { actor, admin } = await identity(request, "mind_campaign_session");
    if (!(await isOwner(actor)))
      throw new ServiceError(
        "Campanhas são restritas à administração do Mind.",
        403,
      );
    const body = await readBody(request, 16000);
    if (action === "list") {
      const page =
        Number.isInteger(body.page) &&
        Number(body.page) >= 0 &&
        Number(body.page) <= 10000
          ? Number(body.page)
          : 0;
      const rows = await admin
        .from("mind_campaigns")
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false })
        .order("id")
        .range(page * 20, page * 20 + 19);
      if (rows.error)
        throw new ServiceError(
          "Campanhas ainda não estão disponíveis. A administração precisa concluir a configuração do banco.",
          503,
        );
      const metrics = await admin.rpc("mind_campaign_metrics", {
        campaign_ids: rows.data.map((r) => r.id),
      });
      databaseError(metrics.error);
      const totals = new Map(
        (metrics.data as { id: string; views: number; clicks: number }[]).map(
          (r) => [r.id, r],
        ),
      );
      return Response.json(
        {
          campaigns: rows.data.map((r) => ({
            ...r,
            views: Number(totals.get(r.id)?.views || 0),
            clicks: Number(totals.get(r.id)?.clicks || 0),
          })),
          total: rows.count,
          page,
        },
        { headers: noStore },
      );
    }
    const id =
      typeof body.id === "string" && UUID.test(body.id) ? body.id : null;
    if (!id) throw new ServiceError("Campanha inválida.");
    let current: Record<string, unknown> | null = null;
    const existing = await admin
      .from("mind_campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    databaseError(existing.error);
    current = existing.data;
    if (current && body.version !== current.updated_at)
      throw new ServiceError(
        "Esta campanha mudou em outra janela. Recarregue antes de salvar.",
        409,
      );
    if (!current && body.version)
      throw new ServiceError(
        "Esta campanha não foi encontrada. Recarregue a lista.",
        409,
      );
    const status = String(body.status);
    if (!["draft", "active", "paused", "archived"].includes(status))
      throw new ServiceError("Escolha um estado válido.");
    if (
      action === "state" &&
      (!current || !["paused", "archived"].includes(status))
    )
      throw new ServiceError("Abra a campanha para revisar antes de ativá-la.");
    if (action === "save" && status === "active" && body.confirmed !== true)
      throw new ServiceError("Revise e confirme a divulgação antes de ativar.");
    const document =
      action === "save" ? sanitizeCampaign(body.campaign, status) : null;
    const result = current
      ? await admin
          .from("mind_campaigns")
          .update({ ...document, status, updated_by: actor })
          .eq("id", id)
          .eq("updated_at", String(body.version))
          .select("*")
          .maybeSingle()
      : await admin
          .from("mind_campaigns")
          .insert({
            ...document,
            id,
            status,
            created_by: actor,
            updated_by: actor,
          })
          .select("*")
          .single();
    databaseError(result.error);
    if (!result.data)
      throw new ServiceError(
        "Esta campanha mudou. Recarregue e tente novamente.",
        409,
      );
    return Response.json({ campaign: result.data }, { headers: noStore });
  } catch (error) {
    return apiError(error);
  }
}
