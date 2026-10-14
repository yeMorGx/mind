import { createClient } from "@supabase/supabase-js";
import { readPromptDetails } from "@/lib/prompt-media";
import type { CreatorProfile } from "@/lib/firebase/publication";
import type { Prompt } from "./types";

function publicClient() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}) : null;
}
type Row={creator_id:string;prompt_id:string;document:Record<string,unknown>;mind_creators:{profile:CreatorProfile}};
const selection="creator_id,prompt_id,document,mind_creators(profile)";
const directorySelection="creator_id,prompt_id,document,mind_creator_directory(profile)";
type DirectoryRow=Omit<Row,"mind_creators">&{mind_creator_directory:{profile:CreatorProfile}};
function directoryRow(row:DirectoryRow):Row { return {...row,mind_creators:row.mind_creator_directory}; }
function millis(value:unknown) {
  if (typeof value==="number") return value;
  if (value && typeof value==="object" && "seconds" in value) return Number(value.seconds)*1000 + Number("nanoseconds" in value ? value.nanoseconds : 0)/1e6;
  return typeof value==="string" ? Date.parse(value) : Number.NaN;
}
function mapRow(row:Row):Prompt {
  const details=readPromptDetails(row.document);
  return {id:row.prompt_id,slug:`${row.creator_id}~${row.prompt_id}`,creatorId:row.creator_id,creatorName:row.mind_creators.profile.name,creatorSlug:"",
    title:String(row.document.title??""),content:String(row.document.content??""),...details,status:"published",isFavorite:false,
    createdAt:millis(row.document.createdAt),updatedAt:millis(row.document.updatedAt),images:details.images.map((image,position)=>({...image,position,path:""}))};
}
export async function getPublicPrompts(limit=24):Promise<Prompt[]> {
  const client=publicClient();if(!client)return [];
  const [native,directory]=await Promise.all([
    client.from("mind_public_prompts").select(selection).limit(limit),
    client.from("mind_directory_prompts").select(directorySelection).limit(limit),
  ]);
  if(native.error)throw native.error;if(directory.error)throw directory.error;
  const rows=[...((native.data??[]) as unknown as Row[]),...((directory.data??[]) as unknown as DirectoryRow[]).map(directoryRow)];
  return rows.map(mapRow).sort((a,b)=>b.createdAt-a.createdAt).slice(0,limit);
}
export async function getPublicPrompt(slug:string):Promise<Prompt|null> {
  const parts=slug.split("~");if(parts.length!==2||parts.some(part=>!part))return null;
  const client=publicClient();if(!client)return null;
  const {data,error}=await client.from("mind_public_prompts").select(selection).eq("creator_id",parts[0]).eq("prompt_id",parts[1]).maybeSingle();
  if(error)throw error;
  if(data)return mapRow(data as unknown as Row);
  const directory=await client.from("mind_directory_prompts").select(directorySelection).eq("creator_id",parts[0]).eq("prompt_id",parts[1]).maybeSingle();
  if(directory.error)throw directory.error;
  return directory.data?mapRow(directoryRow(directory.data as unknown as DirectoryRow)):null;
}
export async function getPublicCreatorProfile(uid:string):Promise<CreatorProfile|null> {
  const client=publicClient();if(!client)return null;
  const [creator,badges]=await Promise.all([
    client.from("mind_creators").select("profile").eq("public_id",uid).maybeSingle(),
    client.from("mind_badges").select("badges").eq("public_id",uid).maybeSingle(),
  ]);
  if(creator.error)throw creator.error;
  if(creator.data)return {...creator.data.profile,badges:badges.data?.badges??[]};
  const directory=await client.from("mind_creator_directory").select("profile,badges").eq("public_id",uid).maybeSingle();
  if(directory.error)throw directory.error;
  return directory.data?{...directory.data.profile,badges:directory.data.badges??[]}:null;
}
export async function getPromptRecommendations(prompt:Prompt):Promise<{creatorPrompts:Prompt[];relatedPrompts:Prompt[]}> {
  const client=publicClient();if(!client)return {creatorPrompts:[],relatedPrompts:[]};
  const [creator,related]=await Promise.all([
    client.from("mind_public_prompts").select(selection).eq("creator_id",prompt.creatorId).neq("prompt_id",prompt.id).limit(3),
    prompt.category?client.from("mind_public_prompts").select(selection).eq("document->>category",prompt.category).neq("creator_id",prompt.creatorId).limit(3):Promise.resolve({data:[],error:null}),
  ]);
  return {creatorPrompts:creator.error?[]:((creator.data??[]) as unknown as Row[]).map(mapRow),relatedPrompts:related.error?[]:((related.data??[]) as unknown as Row[]).map(mapRow)};
}
