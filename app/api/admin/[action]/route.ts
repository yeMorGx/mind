import { requireAdmin, adminApiError, type AdminPermission } from "@/lib/admin/server";
import { databaseError, noStore, readBody, ServiceError } from "@/lib/billing/server";
import { editableBadgeKinds } from "@/lib/badges";
import { GOOGLE_ANALYTICS_ID } from "@/lib/analytics/config";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{action:string}>};
export async function POST(request:Request,context:Context) {
 try {
  const {action}=await context.params;
  const map:Record<string,AdminPermission>={session:"overview",overview:"overview",users:"users",badges:"badges",audit:"audit",analytics:"analytics"};
  if(!map[action])throw new ServiceError("Ação não encontrada.",404);
  const {admin,actor,role,permissions}=await requireAdmin(request,map[action]);
  const body=await readBody(request,6000);
  if(action==="session")return Response.json({actor,role,permissions},{headers:noStore});
  if(action==="overview") {
   const result=await admin.rpc("mind_admin_overview");databaseError(result.error);
   return Response.json(result.data,{headers:noStore});
  }
  const page=Number.isInteger(body.page)&&Number(body.page)>=0&&Number(body.page)<=10000?Number(body.page):0;
  if(action==="users"){
   const result=await admin.rpc("mind_admin_users",{search_value:typeof body.search==="string"?body.search.slice(0,80):"",page_value:page});databaseError(result.error);
   return Response.json(result.data,{headers:noStore});
  }
  if(action==="badges"){
   if(typeof body.target!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(body.target)||!Array.isArray(body.badges)||body.badges.length>editableBadgeKinds.length||new Set(body.badges).size!==body.badges.length||!body.badges.every(v=>typeof v==="string"&&editableBadgeKinds.some(kind=>kind===v))||typeof body.reason!=="string"||body.reason.trim().length<5||body.reason.length>500)throw new ServiceError("Confira os emblemas e o motivo.");
   const result=await admin.rpc("mind_admin_set_badges",{actor,target:body.target,desired:body.badges,reason:body.reason.trim()});databaseError(result.error);
   return Response.json({saved:true},{headers:noStore});
  }
  if(action==="audit"){
   const result=await admin.from("mind_admin_audit").select("id,actor_id,action,target_id,details,created_at",{count:"exact"}).order("created_at",{ascending:false}).order("id",{ascending:false}).range(page*25,page*25+24);databaseError(result.error);
   return Response.json({items:result.data,total:result.count},{headers:noStore});
  }
  return Response.json({ga4TagInstalled:true,ga4MeasurementId:GOOGLE_ANALYTICS_ID,ga4Connected:false,performanceConnected:false},{headers:noStore});
 } catch(error){return adminApiError(error);}
}
