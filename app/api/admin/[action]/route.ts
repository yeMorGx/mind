import { requireAdmin, adminApiError, type AdminPermission } from "@/lib/admin/server";
import { databaseError, noStore, readBody, ServiceError, stripeClient } from "@/lib/billing/server";
import { editableBadgeKinds } from "@/lib/badges";
import { GOOGLE_ANALYTICS_ID } from "@/lib/analytics/config";
import type Stripe from "stripe";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{action:string}>};
type SalesSubscription={public_id:string;customer_id:string|null;subscription_id:string;name:string;username:string|null;avatar:string|null;badges:string[];plan:string;status:string;period_end:string|null;cancel_at_period_end:boolean;updated_at:string};
function invoiceSubscriptionId(invoice:Stripe.Invoice) {
 const parent=invoice.parent;
 if(parent?.type!=="subscription_details")return null;
 const details=parent.subscription_details;
 if(!details)return null;
 const subscription=details.subscription;
 return typeof subscription==="string"?subscription:subscription.id;
}
export async function POST(request:Request,context:Context) {
 try {
  const {action}=await context.params;
  const map:Record<string,AdminPermission>={session:"overview",overview:"overview",users:"users",badges:"badges",audit:"audit",analytics:"analytics",sales:"sales","grant-premium":"sales","revoke-premium":"sales"};
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
  if(action==="grant-premium"){
   const target=typeof body.target==="string"?body.target:"";
   const reason=typeof body.reason==="string"?body.reason.trim():"";
   const expiresAt=body.expiresAt==null||body.expiresAt===""?null:typeof body.expiresAt==="string"?new Date(body.expiresAt):new Date("invalid");
   if(!/^[A-Za-z0-9_-]{1,128}$/.test(target)||reason.length<5||reason.length>500||(expiresAt&&(!Number.isFinite(expiresAt.getTime())||expiresAt.getTime()<=Date.now())))throw new ServiceError("Confira a conta, a validade e o motivo da concessão.");
   const result=await admin.rpc("mind_admin_grant_premium",{actor,target,expires_at:expiresAt?.toISOString()??null,reason});databaseError(result.error);
   return Response.json({saved:true},{headers:noStore});
  }
  if(action==="revoke-premium"){
   const target=typeof body.target==="string"?body.target:"";
   const reason=typeof body.reason==="string"?body.reason.trim():"";
   if(!/^[A-Za-z0-9_-]{1,128}$/.test(target)||reason.length<5||reason.length>500)throw new ServiceError("Confira a conta e o motivo da revogação.");
   const result=await admin.rpc("mind_admin_revoke_premium",{actor,target,reason});databaseError(result.error);
   return Response.json({saved:true},{headers:noStore});
  }
  if(action==="sales"){
   const result=await admin.rpc("mind_admin_sales_data",{actor});databaseError(result.error);
   const records=result.data as {summary:{activeSubscriptions:number;activeManualGrants:number};subscriptions:SalesSubscription[];grants:Array<{public_id:string;name:string;avatar:string|null;username:string|null;badges:string[];plan:string;reason:string;granted_at:string;granted_by:string|null;expires_at:string|null;active:boolean}>};
   const period=body.period==="month"||body.period==="90d"?body.period:"30d";
   const now=new Date();
   const start=period==="month"?new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)):new Date(now.getTime()-(period==="90d"?90:30)*24*60*60*1000);
   const subscriptionById=new Map(records.subscriptions.map(row=>[row.subscription_id,row]));
   const amountByCurrency=new Map<string,number>();
   const payments:Array<{id:string;number:string|null;customer:string;email:string|null;plan:string;amountPaid:number;currency:string;createdAt:string;invoiceUrl:string|null}> = [];
   let paidInvoiceCount=0,revenueComplete=true,stripeConnected=Boolean(process.env.STRIPE_SECRET_KEY),stripeError=false;
   if(stripeConnected){
    try{
     const stripe=stripeClient();let cursor:string|undefined;
     for(let pageNumber=0;pageNumber<6;pageNumber++){
      const page=await stripe.invoices.list({status:"paid",created:{gte:Math.floor(start.getTime()/1000),lt:Math.floor(now.getTime()/1000)},limit:100,...(cursor?{starting_after:cursor}:{})});
      for(const invoice of page.data){
       const subscriptionId=invoiceSubscriptionId(invoice);const subscription=subscriptionId?subscriptionById.get(subscriptionId):undefined;
       if(!subscription)continue;
       paidInvoiceCount++;
       const currency=invoice.currency.toUpperCase();amountByCurrency.set(currency,(amountByCurrency.get(currency)||0)+invoice.amount_paid);
       if(payments.length<20)payments.push({id:invoice.id,number:invoice.number,customer:subscription.name||invoice.customer_name||invoice.customer_email||"Cliente",email:invoice.customer_email,plan:subscription.plan,amountPaid:invoice.amount_paid,currency,createdAt:new Date(invoice.created*1000).toISOString(),invoiceUrl:invoice.hosted_invoice_url??null});
      }
      if(!page.has_more)break;
      cursor=page.data.at(-1)?.id;
      if(pageNumber===5)revenueComplete=false;
     }
    }catch(failure){
     stripeConnected=false;stripeError=true;
     console.error("Mind admin Stripe report unavailable",failure instanceof Error?failure.name:"StripeError");
    }
   }
   return Response.json({summary:records.summary,subscriptions:records.subscriptions.map(row=>({public_id:row.public_id,name:row.name,username:row.username,avatar:row.avatar,badges:row.badges,plan:row.plan,status:row.status,period_end:row.period_end,cancel_at_period_end:row.cancel_at_period_end,updated_at:row.updated_at})),grants:records.grants,stripe:{connected:stripeConnected,error:stripeError,periodStart:start.toISOString(),paidInvoiceCount,revenueComplete,revenue:[...amountByCurrency].map(([currency,amountPaid])=>({currency,amountPaid})),payments}},{headers:noStore});
  }
  if(action==="audit"){
   const result=await admin.from("mind_admin_audit").select("id,actor_id,action,target_id,details,created_at",{count:"exact"}).order("created_at",{ascending:false}).order("id",{ascending:false}).range(page*25,page*25+24);databaseError(result.error);
   return Response.json({items:result.data,total:result.count},{headers:noStore});
  }
  return Response.json({ga4TagInstalled:true,ga4MeasurementId:GOOGLE_ANALYTICS_ID,ga4Connected:false,performanceConnected:false},{headers:noStore});
 } catch(error){return adminApiError(error);}
}
