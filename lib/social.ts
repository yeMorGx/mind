import { usingSupabase,type MindUser } from "@/lib/backend";
import { requireSupabaseClient } from "@/lib/supabase/client";
import { requireFirebaseServices } from "@/lib/firebase/client";
export type SocialTarget={creatorId:string;promptId?:string};
export type SocialState={followers:number;following:number;likes:number;is_following:boolean;is_liked:boolean};
export const socialKey=(target:SocialTarget)=>`${target.creatorId}:${target.promptId||""}`;
export async function readSocial(targets:SocialTarget[],actorId:string|null,signal?:AbortSignal):Promise<Record<string,SocialState>>{
  let query=requireSupabaseClient().rpc("mind_social_snapshot",{targets_value:targets,actor_value:actorId});
  if(signal)query=query.abortSignal(signal);
  const {data,error}=await query;if(error)throw error;
  return Object.fromEntries((data??[]).map((row:{creator_id:string;prompt_id:string|null;followers:number;following:number;likes:number;is_following:boolean;is_liked:boolean})=>[socialKey({creatorId:row.creator_id,promptId:row.prompt_id||undefined}),{followers:Number(row.followers),following:Number(row.following),likes:Number(row.likes),is_following:row.is_following,is_liked:row.is_liked}]));
}
export async function saveSocial(user:MindUser,target:SocialTarget,kind:"follow"|"like",active:boolean){
  if(usingSupabase()){
    const {error}=await requireSupabaseClient().rpc("mind_set_social",{kind_value:kind,target_value:target.creatorId,prompt_value:target.promptId||null,active_value:active});if(error)throw error;
  }else{
    const current=requireFirebaseServices().auth.currentUser;if(!current||current.uid!==user.uid)throw new Error("Entre novamente na sua conta.");
    const {error}=await requireSupabaseClient().functions.invoke("social-actions",{headers:{Authorization:`Bearer ${await current.getIdToken()}`},body:{kind,targetId:target.creatorId,promptId:target.promptId,active}});
    if(error){const response="context"in error?error.context:null;if(response instanceof Response){const body=await response.json().catch(()=>null);if(body?.error)throw new Error(body.error);}throw error;}
  }
}
