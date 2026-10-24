import {requireAdmin,adminApiError} from "@/lib/admin/server";
import { databaseError, noStore, readBody } from "@/lib/billing/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
 try {
  const { actor, admin } = await requireAdmin(request,"inbox");
  const body = await readBody(request);
  const page = typeof body.page === "number" && Number.isInteger(body.page) && body.page >= 0 && body.page <= 10000 ? body.page : 0;
  const result = await admin.from("mind_inquiries").select("id,kind,name,email,organization,subject,website,budget,message,created_at", { count: "exact" }).order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * 25, page * 25 + 24);
  databaseError(result.error);
  const recorded=await admin.from("mind_admin_audit").insert({actor_id:actor,action:"inbox.read",details:{page}});databaseError(recorded.error);
  return Response.json({ inquiries: result.data, total: result.count, page }, { headers: noStore });
 } catch (error) { return adminApiError(error); }
}
