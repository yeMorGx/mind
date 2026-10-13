import type { User } from "@supabase/supabase-js";
import { requireSupabaseClient } from "./client";
import type {
  OnboardingData,
  Prompt,
  PromptDraft,
  PromptImage,
  PromptImageInput,
  PromptImageRole,
  PromptStatus,
} from "./types";

const IMAGE_BUCKET = "prompt-images";
const IMAGE_LIMIT = 20 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const SIGNED_URL_TTL = 60 * 60 * 24;

type PromptImageRow = {
  id: string;
  storage_path: string;
  role: PromptImageRole;
  position: number;
  label: string;
};

type PromptRow = {
  id: string;
  slug: string;
  creator_id: string;
  creator_name: string;
  creator_slug: string;
  title: string;
  content: string;
  description: string | null;
  category: string | null;
  model: string | null;
  status: PromptStatus;
  created_at: string;
  updated_at: string;
  prompt_images?: PromptImageRow[];
};

const now = () => new Date().toISOString();

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 55);
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function onboardingDataFromProfile(
  profile: Record<string, unknown> | null,
  user: User,
): OnboardingData {
  const invitedEmails = profile?.invited_emails;
  const usageType = profile?.usage_type;
  return {
    name: String(profile?.name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? ""),
    email: String(profile?.email ?? user.email ?? ""),
    role: String(profile?.role ?? ""),
    source: String(profile?.source ?? ""),
    usageType: usageType === "individual" || usageType === "team" ? usageType : "",
    teamName: String(profile?.team_name ?? ""),
    teamSize: String(profile?.team_size ?? ""),
    invitedEmails: Array.isArray(invitedEmails) ? invitedEmails.map(String) : [],
    creatorName: String(profile?.creator_name ?? ""),
    creatorIcon: String(profile?.creator_icon ?? "🧠"),
    creatorSlug: String(profile?.creator_slug ?? ""),
    onboardingComplete: profile?.onboarding_complete === true,
  };
}

function onboardingPatch(values: Partial<OnboardingData>) {
  const patch: Record<string, unknown> = {};
  const fields: Array<[keyof OnboardingData, string]> = [
    ["name", "name"],
    ["email", "email"],
    ["role", "role"],
    ["source", "source"],
    ["usageType", "usage_type"],
    ["teamName", "team_name"],
    ["teamSize", "team_size"],
    ["invitedEmails", "invited_emails"],
    ["creatorName", "creator_name"],
    ["creatorIcon", "creator_icon"],
    ["creatorSlug", "creator_slug"],
    ["onboardingComplete", "onboarding_complete"],
  ];
  for (const [source, target] of fields) {
    if (values[source] !== undefined) patch[target] = values[source];
  }
  return patch;
}

export async function saveOnboardingProgress(
  user: User,
  values: Partial<OnboardingData>,
) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      ...onboardingPatch(values),
      updated_at: now(),
    },
    { onConflict: "id" },
  );
  throwIfError(error);
}

export async function createCreatorProfile(user: User, values: OnboardingData) {
  if (!values.role) throw new Error("Volte e escolha uma profissão.");
  if (!values.usageType) throw new Error("Volte e escolha como você pretende usar o Mind.");
  if (values.usageType === "team" && !values.teamName.trim()) {
    throw new Error("Volte e informe o nome da equipe.");
  }
  if (!values.creatorName.trim()) throw new Error("Digite o nome público do seu perfil.");

  const supabase = requireSupabaseClient();
  const creatorSlug = `${slugify(values.creatorName) || "criador"}-${user.id.slice(0, 6)}`;
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      ...onboardingPatch({
        ...values,
        name: values.name.trim(),
        creatorName: values.creatorName.trim(),
        creatorSlug,
        onboardingComplete: true,
      }),
      updated_at: now(),
    },
    { onConflict: "id" },
  );
  throwIfError(error);
  return creatorSlug;
}

async function signPromptImages(rows: PromptImageRow[]): Promise<PromptImage[]> {
  if (!rows.length) return [];
  const supabase = requireSupabaseClient();
  const paths = rows.map((row) => row.storage_path);
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);
  throwIfError(error);

  const urls = new Map(
    (data ?? []).flatMap((entry) =>
      entry.path && entry.signedUrl ? [[entry.path, entry.signedUrl] as const] : [],
    ),
  );
  return rows
    .map((row) => ({
      id: row.id,
      path: row.storage_path,
      url: urls.get(row.storage_path) ?? "",
      role: row.role,
      position: Number(row.position ?? 0),
      label: String(row.label ?? ""),
    }))
    .filter((image) => image.url)
    .sort((a, b) => a.position - b.position);
}

async function toPrompt(row: PromptRow, isFavorite = false): Promise<Prompt> {
  return {
    id: row.id,
    slug: row.slug,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    creatorSlug: row.creator_slug,
    title: row.title,
    content: row.content,
    description: row.description ?? "",
    category: row.category ?? "",
    model: row.model ?? "",
    status: row.status,
    isFavorite,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    images: await signPromptImages(row.prompt_images ?? []),
  };
}

const promptSelect =
  "id,slug,creator_id,creator_name,creator_slug,title,content,description,category,model,status,created_at,updated_at,prompt_images(id,storage_path,role,position,label)";

export async function listMyPrompts(userId: string): Promise<Prompt[]> {
  const supabase = requireSupabaseClient();
  const [{ data: rows, error }, { data: favorites, error: favoritesError }] = await Promise.all([
    supabase
      .from("prompts")
      .select(promptSelect)
      .eq("creator_id", userId)
      .order("updated_at", { ascending: false }),
    supabase.from("prompt_favorites").select("prompt_id").eq("user_id", userId),
  ]);
  throwIfError(error);
  throwIfError(favoritesError);
  const favoriteIds = new Set((favorites ?? []).map((favorite) => favorite.prompt_id as string));
  return Promise.all(
    ((rows ?? []) as unknown as PromptRow[]).map((row) =>
      toPrompt(row, favoriteIds.has(row.id)),
    ),
  );
}

export async function listPublicPrompts(limit = 24): Promise<Prompt[]> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("prompts")
    .select(promptSelect)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIfError(error);
  return Promise.all(((data ?? []) as unknown as PromptRow[]).map((row) => toPrompt(row)));
}

export async function getPublicPromptBySlug(slug: string): Promise<Prompt | null> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("prompts")
    .select(promptSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  throwIfError(error);
  return data ? toPrompt(data as unknown as PromptRow) : null;
}

function validateImage(file: File) {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Use imagens JPG, PNG, WebP ou AVIF.");
  }
  if (file.size > IMAGE_LIMIT) {
    throw new Error("Cada imagem pode ter no máximo 20 MB.");
  }
}

async function uploadPromptImage(userId: string, file: File) {
  validateImage(file);
  const supabase = requireSupabaseClient();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "img";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  throwIfError(error);
  return path;
}

function promptSlug(title: string) {
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${slugify(title) || "prompt"}-${suffix}`;
}

export async function savePrompt(
  user: User,
  profile: OnboardingData,
  existing: Prompt | null,
  draft: PromptDraft,
) {
  const title = draft.title.trim();
  const content = draft.content.trim();
  if (!title || !content) throw new Error("Preencha o título e o prompt.");
  if (draft.images.filter((image) => image.role === "gallery").length > 8) {
    throw new Error("Você pode adicionar até 8 imagens ao carrossel.");
  }
  if (draft.images.filter((image) => image.role === "reference").length > 1 ||
    draft.images.filter((image) => image.role === "before").length > 1 ||
    draft.images.filter((image) => image.role === "after").length > 1) {
    throw new Error("Use uma referência e no máximo um par de antes e depois.");
  }

  const supabase = requireSupabaseClient();
  const uploadedPaths: string[] = [];
  const newImages: Array<{ input: PromptImageInput; path: string }> = [];
  let assetsCommitted = false;

  try {
    for (const image of draft.images) {
      if (image.file) {
        const path = await uploadPromptImage(user.id, image.file);
        uploadedPaths.push(path);
        newImages.push({ input: image, path });
      }
    }

    const imagePosition = new Map<PromptImageInput, number>();
    draft.images.forEach((image, index) => imagePosition.set(image, index));
    const promptValues = {
      creator_id: user.id,
      creator_name: profile.creatorName || profile.name || "Criador Mind",
      creator_slug: profile.creatorSlug,
      title,
      content,
      description: draft.description.trim(),
      category: draft.category.trim(),
      model: draft.model.trim(),
      updated_at: now(),
    };

    let promptId = existing?.id ?? "";
    let slug = existing?.slug ?? promptSlug(title);
    if (existing) {
      const { error } = await supabase
        .from("prompts")
        .update(promptValues)
        .eq("id", existing.id)
        .eq("creator_id", user.id);
      throwIfError(error);
    } else {
      const { data, error } = await supabase
        .from("prompts")
        .insert({ ...promptValues, slug, status: "draft" })
        .select("id,slug")
        .single();
      throwIfError(error);
      if (!data) throw new Error("Não foi possível criar o rascunho do prompt.");
      promptId = data.id;
      slug = data.slug;
    }

    const retainedIds = new Set(
      draft.images.filter((image) => image.id && image.path).map((image) => image.id!),
    );

    for (const image of draft.images) {
      const position = imagePosition.get(image) ?? 0;
      const retained = image.id && image.path;
      if (retained) {
        const { error } = await supabase
          .from("prompt_images")
          .update({ role: image.role, position, label: image.label.trim() })
          .eq("id", image.id)
          .eq("prompt_id", promptId);
        throwIfError(error);
      } else {
        const uploaded = newImages.find((entry) => entry.input === image);
        if (!uploaded) continue;
        const { error } = await supabase.from("prompt_images").insert({
          prompt_id: promptId,
          creator_id: user.id,
          storage_path: uploaded.path,
          role: image.role,
          position,
          label: image.label.trim(),
        });
        throwIfError(error);
      }
    }

    const removed = (existing?.images ?? []).filter((image) => !retainedIds.has(image.id));
    for (const image of removed) {
      const { error } = await supabase
        .from("prompt_images")
        .delete()
        .eq("id", image.id)
        .eq("prompt_id", promptId);
      throwIfError(error);
    }
    assetsCommitted = true;

    const { error: publishError } = await supabase
      .from("prompts")
      .update({ status: draft.status, updated_at: now() })
      .eq("id", promptId)
      .eq("creator_id", user.id);
    throwIfError(publishError);

    const removedPaths = removed.map((image) => image.path);
    if (removedPaths.length) {
      const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(removedPaths);
      throwIfError(error);
    }
    return { id: promptId, slug };
  } catch (error) {
    if (!assetsCommitted && uploadedPaths.length) {
      await supabase.from("prompt_images").delete().in("storage_path", uploadedPaths);
      await supabase.storage.from(IMAGE_BUCKET).remove(uploadedPaths).catch(() => undefined);
    }
    throw error;
  }
}

export async function setPromptFavorite(userId: string, promptId: string, isFavorite: boolean) {
  const supabase = requireSupabaseClient();
  if (isFavorite) {
    const { error } = await supabase
      .from("prompt_favorites")
      .insert({ user_id: userId, prompt_id: promptId });
    throwIfError(error);
    return;
  }
  const { error } = await supabase
    .from("prompt_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("prompt_id", promptId);
  throwIfError(error);
}

export async function removePrompt(userId: string, prompt: Prompt) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", prompt.id)
    .eq("creator_id", userId);
  throwIfError(error);

  const paths = prompt.images.map((image) => image.path);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
    throwIfError(storageError);
  }
}

export function imageInputFromPrompt(image: PromptImage): PromptImageInput {
  return {
    id: image.id,
    path: image.path,
    url: image.url,
    role: image.role,
    position: image.position,
    label: image.label,
  };
}

export function promptStatusLabel(status: PromptStatus) {
  return status === "published" ? "Publicado" : "Rascunho";
}
