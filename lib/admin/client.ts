import type {MindUser} from "@/lib/backend";
import {accountHeaders} from "@/lib/billing/client";
export class AdminRequestError extends Error {constructor(message:string,public code:string){super(message);}}
export async function adminRequest<T>(user:MindUser,action:string,body:Record<string,unknown>={}):Promise<T>{
 const response=await fetch(`/api/admin/${action}`,{method:"POST",headers:{...await accountHeaders(user),"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
 const result=await response.json();
 if(!response.ok && result.code==="admin_mfa_required")window.dispatchEvent(new Event("mind:admin-mfa"));
 if(!response.ok)throw new AdminRequestError(result.error||"Administração indisponível. Tente novamente.",result.code||"admin_unavailable");
 return result;
}
