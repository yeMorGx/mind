import {requireSupabaseClient} from "@/lib/supabase/client";
import {usingSupabase} from "@/lib/backend";
import {requireFirebaseServices} from "@/lib/firebase/client";
export async function uploadPromptVideo(file:File){
 if(!["video/mp4","video/webm"].includes(file.type)||file.size>30*1024*1024||file.size===0)throw new Error("Escolha um vídeo MP4 ou WebM de até 30 MB.");
 const client=requireSupabaseClient();
 const token=usingSupabase()?(await client.auth.getSession()).data.session?.access_token:await requireFirebaseServices().auth.currentUser?.getIdToken();
 if(!token)throw new Error("Entre novamente para enviar o vídeo.");
 const {data,error}=await client.functions.invoke("prompt-media-upload",{headers:{Authorization:`Bearer ${token}`},body:{size:file.size,type:file.type}});
 if(error||!data?.path)throw new Error("Não foi possível preparar o envio. Confira sua sessão e tente novamente.");
 const uploaded=await client.storage.from("mind-prompt-videos").uploadToSignedUrl(data.path,data.token,file,{contentType:file.type});
 if(uploaded.error)throw new Error("Não foi possível enviar o vídeo. Tente novamente.");
 return data.path as string;
}

export async function getVideoPlaybackUrl(path:string){
 const client=requireSupabaseClient();const result=await client.storage.from("mind-prompt-videos").createSignedUrl(path,300);
 if(!result.error)return result.data.signedUrl;
 const firebase=requireFirebaseServices().auth.currentUser;
 if(!usingSupabase()&&firebase){const response=await client.functions.invoke("prompt-media-upload",{headers:{Authorization:`Bearer ${await firebase.getIdToken()}`},body:{action:"read",path}});if(!response.error&&response.data?.url)return response.data.url as string;}
 throw result.error;
}
