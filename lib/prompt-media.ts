export type PromptImageRole = "gallery" | "reference" | "before" | "after";
export type StoredPromptImage = { id: string; url: string; label: string; role: PromptImageRole };
export type PromptDetails = { description: string; category: string; model: string; images: StoredPromptImage[] };
export const MAX_PROMPT_IMAGES = 8;
export const MAX_IMAGE_CHARS = 80_000;
export const MAX_IMAGES_CHARS = 700_000;
export const emptyPromptDetails: PromptDetails = { description: "", category: "", model: "", images: [] };
const roles = new Set(["gallery", "reference", "before", "after"]);
const imageUrl = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

export function readPromptDetails(value: Record<string, unknown>): PromptDetails {
  const images: StoredPromptImage[] = [];
  let size = 0;
  for (const item of Array.isArray(value.images) ? value.images : []) {
    if (!item || typeof item !== "object") continue;
    const image = item as Record<string, unknown>;
    if (typeof image.url !== "string" || !imageUrl.test(image.url) || image.url.length > MAX_IMAGE_CHARS || !roles.has(String(image.role))) continue;
    if (images.length >= MAX_PROMPT_IMAGES || size + image.url.length > MAX_IMAGES_CHARS) continue;
    size += image.url.length;
    images.push({ id: String(image.id ?? images.length), url: image.url, label: String(image.label ?? "").slice(0, 120), role: image.role as PromptImageRole });
  }
  return { description: String(value.description ?? "").slice(0, 500), category: String(value.category ?? "").slice(0, 80), model: String(value.model ?? "").slice(0, 80), images };
}

export function validatePromptDetails(title: string, content: string, details: PromptDetails) {
  if (!title.trim() || !content.trim()) throw new Error("Preencha o título e o conteúdo do prompt.");
  if (title.length > 120 || content.length > 20000) throw new Error("Use até 120 caracteres no título e 20.000 no prompt.");
  if (details.description.length > 500 || details.category.length > 80 || details.model.length > 80) throw new Error("Os detalhes do prompt ultrapassam o limite permitido.");
  if (details.images.length > MAX_PROMPT_IMAGES) throw new Error("Adicione até 8 imagens por prompt.");
  let size = 0;
  const ids = new Set<string>();
  const comparisonRoles = new Set<string>();
  for (const image of details.images) {
    if (!roles.has(image.role) || !imageUrl.test(image.url) || image.url.length > MAX_IMAGE_CHARS || image.label.length > 120) throw new Error("Uma imagem está inválida. Remova-a e adicione novamente.");
    size += image.url.length;
    if (ids.has(image.id)) throw new Error("Uma imagem está repetida. Remova a cópia e tente novamente.");
    ids.add(image.id);
    if (image.role === "before" || image.role === "after") {
      if (comparisonRoles.has(image.role)) throw new Error("Escolha apenas uma imagem de antes e uma de depois.");
      comparisonRoles.add(image.role);
    }
  }
  if (size > MAX_IMAGES_CHARS || new TextEncoder().encode(JSON.stringify({ title, content, ...details })).length > 850_000) throw new Error("As imagens juntas estão muito grandes. Remova algumas e tente novamente.");
}

export async function preparePromptImage(file: File): Promise<StoredPromptImage> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Escolha uma imagem JPEG, PNG ou WebP de até 5 MB.");
  let bitmap: ImageBitmap | HTMLImageElement | undefined;
  let release = () => {};
  try {
    try {
      if (typeof createImageBitmap === "function") {
        const decoded = await createImageBitmap(file);
        bitmap = decoded;
        release = () => decoded.close();
      } else {
        const url = URL.createObjectURL(file);
        release = () => URL.revokeObjectURL(url);
        const image = new Image();
        image.src = url;
        await image.decode();
        bitmap = image;
      }
    } catch { throw new Error(`Não foi possível ler a imagem ${file.name}. Escolha outro arquivo.`); }
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error("Esta imagem tem resolução muito alta. Reduza-a antes de adicionar.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar esta imagem no navegador.");
    for (const edge of [960, 768, 600]) {
      const ratio = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.8, 0.65, 0.45]) {
        const url = canvas.toDataURL("image/webp", quality);
        if (url.length <= MAX_IMAGE_CHARS && imageUrl.test(url)) return { id: crypto.randomUUID(), url, role: "gallery", label: file.name.slice(0, 120) };
      }
    }
    throw new Error("Não foi possível otimizar esta imagem. Escolha uma versão menor.");
  } finally { release(); }
}
