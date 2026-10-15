import {requireSupabaseClient} from "@/lib/supabase/client";
import {usingSupabase,type MindUser} from "@/lib/backend";
import {requireFirebaseServices} from "@/lib/firebase/client";
import type {BadgeKind} from "@/lib/firebase/badges";
export type PromptComment={id:string;actor_id:string;body:string;created_at:string;author_name:string;avatar_url:string;username:string;badges:BadgeKind[]};
export async function readComments(creatorId:string,promptId:string,before?:PromptComment,signal?:AbortSignal){let query=requireSupabaseClient().rpc("mind_read_comments",{creator_value:creatorId,prompt_value:promptId,before_time:before?.created_at??null,before_id:before?.id??null});if(signal)query=query.abortSignal(signal);const{data,error}=await query;if(error)throw error;return(data??[])as PromptComment[];}
export async function writeComment(user:MindUser,creatorId:string,promptId:string,id:string,body:string,remove=false){
 const client=requireSupabaseClient();
 if(usingSupabase()){
  const result=remove?await client.from("mind_comments").delete().eq("id",id).eq("creator_id",creatorId).eq("prompt_id",promptId):await client.from("mind_comments").insert({id,actor_id:user.uid,creator_id:creatorId,prompt_id:promptId,body:body.trim()});
  if(result.error&&result.error.code!=="23505")throw result.error;
 }else{
  const current=requireFirebaseServices().auth.currentUser;if(!current||current.uid!==user.uid)throw new Error("Entre novamente.");
  const result=await client.functions.invoke("social-actions",{headers:{Authorization:`Bearer ${await current.getIdToken()}`},body:{kind:remove?"delete_comment":"comment",targetId:creatorId,promptId,id,body}});if(result.error)throw result.error;
 }
}
