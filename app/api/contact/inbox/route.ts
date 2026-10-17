import { apiError, assertOrigin, databaseError, identity, isOwner, noStore, readBody, ServiceError } from "@/lib/billing/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
 try {
  assertOrigin(request);
  const { actor, admin } = await identity(request);
  if (!await isOwner(actor)) throw new ServiceError("Acesso restrito à administração.", 403);
  const body = await readBody(request);
  const page = typeof body.page === "number" && Number.isInteger(body.page) && body.page >= 0 && body.page <= 10000 ? body.page : 0;
  const result = await admin.from("mind_inquiries").select("id,kind,name,email,organization,subject,website,budget,message,created_at", { count: "exact" }).order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * 25, page * 25 + 24);
  databaseError(result.error);
  return Response.json({ inquiries: result.data, total: result.count, page }, { headers: noStore });
 } catch (error) { return apiError(error); }
}
