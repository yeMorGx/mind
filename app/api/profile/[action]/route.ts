import sharp from "sharp";
import { apiError, assertOrigin, databaseError, identity, noStore, readBody, ServiceError } from "@/lib/billing/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Context = { params: Promise<{ action: string }> };

export async function POST(request: Request, context: Context) {
 try {
  assertOrigin(request);
  const { action } = await context.params;
  if (!["ensure", "save", "upload"].includes(action)) throw new ServiceError("Ação não encontrada.", 404);
  const { actor, admin } = await identity(request, "mind_billing_session", action !== "ensure");
  if (action !== "upload") {
   if (request.headers.get("x-mind-backend") !== "firebase") throw new ServiceError("Use sua sessão atual para editar o perfil.", 409);
   const body = await readBody(request, 200000);
   const source = body.profile;
   if (!source || typeof source !== "object" || Array.isArray(source)) throw new ServiceError("Perfil inválido.");
   const input = source as Record<string, unknown>;
   const image = (value: unknown) => typeof value === "string" && value.length <= 80000 && /^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(value) ? value : "";
   const profile = {name: String(input.name ?? "").trim(), bio: String(input.bio ?? "").trim(), headline: String(input.headline ?? "").trim(), avatarUrl: image(input.avatarUrl), bannerUrl: image(input.bannerUrl)};
   if (!profile.name || profile.name.length > 80 || profile.bio.length > 1000 || profile.headline.length > 100) throw new ServiceError("Confira o nome, a apresentação e a bio.");
   const result = await admin.rpc("mind_save_directory_identity", {public_id_value: actor, profile_values: profile, username_value: typeof input.username === "string" ? input.username : null, ensure_only: action === "ensure"});
   if (result.error) {
    if (/^(Este @|Use de 3|Sua conta|GIFs)/.test(result.error.message)) throw new ServiceError(result.error.message, 409);
    databaseError(result.error);
   }
   return Response.json({ saved: true }, { headers: noStore });
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new ServiceError("Envie um arquivo de imagem.");
  if (Number(request.headers.get("content-length") || 0) > 4400000) throw new ServiceError("O arquivo excede o tamanho permitido.", 413);
  const form = await request.formData(), file = form.get("file"), field = form.get("field");
  if (!(file instanceof File) || !file.size || file.size > 4 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || !["avatarUrl", "bannerUrl"].includes(String(field))) throw new ServiceError("Envie uma imagem válida de até 4 MB.");
  let crop: {x:number;y:number;width:number;height:number};
  try { crop = JSON.parse(String(form.get("crop"))); } catch { throw new ServiceError("Ajuste o recorte da imagem novamente."); }
  if (![crop?.x,crop?.y,crop?.width,crop?.height].every(value=>typeof value==="number" && Number.isFinite(value)) || crop.x<0 || crop.y<0 || crop.width<=0 || crop.height<=0 || crop.x+crop.width>1.002 || crop.y+crop.height>1.002) throw new ServiceError("Ajuste o recorte da imagem novamente.");
  const bytes = Buffer.from(await file.arrayBuffer());
  let image = sharp(bytes, {animated: true, limitInputPixels: 60000000});
  const meta = await image.metadata();
  if (!meta.width || !meta.height || !["jpeg","png","webp","gif"].includes(meta.format || "")) throw new ServiceError("Formato de imagem não suportado.");
  const pages = meta.pages || 1, animated = pages>1 || meta.format === "gif";
  const originalHeight = meta.pageHeight || meta.height;
  if (pages>200 || meta.width*originalHeight*pages>60000000) throw new ServiceError("Esta animação é muito grande. Escolha um GIF menor.");
  if (animated) {
   const result = await admin.rpc("mind_billing_status", {actor}); databaseError(result.error);
   if (!["plus","premium"].includes(result.data?.plan)) throw new ServiceError("GIFs estão disponíveis nos planos Plus e Premium.", 403);
  }
  const swapped = (meta.orientation || 0)>=5;
  const width = swapped ? originalHeight : meta.width, height = swapped ? meta.width : originalHeight;
  const left = Math.min(width-1,Math.max(0,Math.round(crop.x*width))), top = Math.min(height-1,Math.max(0,Math.round(crop.y*height)));
  const area = {left,top,width:Math.min(width-left,Math.max(1,Math.round(crop.width*width))),height:Math.min(height-top,Math.max(1,Math.round(crop.height*height)))};
  image = image.rotate().extract(area).resize({width: field==="avatarUrl" ? 1024 : 2560, withoutEnlargement:true});
  const output = animated ? await image.gif({effort:3}).toBuffer() : await image.webp({quality:95,effort:4}).toBuffer();
  if (output.length>8*1024*1024) throw new ServiceError("O resultado ficou muito grande. Escolha uma imagem menor.");
  const path = `${actor}/${crypto.randomUUID()}.${animated?"gif":"webp"}`;
  const upload = await admin.storage.from("mind-profile-images").upload(path, output, {contentType:animated?"image/gif":"image/webp", cacheControl:"31536000", upsert:false});
  if (upload.error) throw new ServiceError("Não foi possível enviar a imagem. Tente novamente.",503);
  const {data} = admin.storage.from("mind-profile-images").getPublicUrl(path);
  return Response.json({url:data.publicUrl}, {headers:noStore});
 } catch (error) { return apiError(error); }
}
