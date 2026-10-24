import { accountHeaders } from "@/lib/billing/client";
import type { MindUser } from "@/lib/backend";
export type ProfileCrop = {x:number;y:number;width:number;height:number};
export type ProfileImageField = "avatarUrl" | "bannerUrl";
export function validateProfileFile(file: File) {
 if (!["image/jpeg","image/png","image/webp","image/gif"].includes(file.type) || !file.size || file.size>12*1024*1024) throw new Error("Escolha JPEG, PNG ou WebP de até 12 MB, ou GIF de até 4 MB.");
 if (file.type==="image/gif" && file.size>4*1024*1024) throw new Error("Escolha um GIF de até 4 MB.");
}
/** Preserve the original file unless it exceeds the request limit. Never flatten GIFs. */
async function uploadFile(file: File): Promise<File> {
 if (file.size<=4*1024*1024) return file;
 const bitmap=await createImageBitmap(file);
 try {
  if (bitmap.width*bitmap.height>40000000) throw new Error("Esta imagem tem resolução muito alta. Reduza-a antes de adicionar.");
  const scale=Math.min(1,4096/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext("2d");if(!context)throw new Error("Não foi possível preparar esta imagem no navegador.");
  context.imageSmoothingQuality="high";context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",0.98));
  if(!blob || blob.size>4*1024*1024)throw new Error("O arquivo excede o tamanho permitido.");
  return new File([blob],"profile.webp",{type:"image/webp"});
 } finally {bitmap.close();}
}
export async function uploadProfileImage(user: MindUser,file: File,field: ProfileImageField,crop: ProfileCrop) {
 const form=new FormData();form.set("file",await uploadFile(file));form.set("field",field);form.set("crop",JSON.stringify(crop));
 const response=await fetch("/api/profile/upload",{method:"POST",headers:await accountHeaders(user),body:form});
 const result=await response.json().catch(()=>null);
 if(!response.ok || typeof result?.url!=="string")throw new Error(result?.error||"Não foi possível enviar a imagem. Tente novamente.");
 return result.url as string;
}
