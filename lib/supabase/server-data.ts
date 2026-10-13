import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Prompt, PromptImage, PromptStatus } from "./types";

const bucket = "prompt-images";
const signedUrlTtl = 60 * 60 * 24;

type ImageRow = {
  id: string;
  storage_path: string;
  role: PromptImage["role"];
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
  prompt_images?: ImageRow[];
};

function createPublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function signImages(client: SupabaseClient, rows: ImageRow[]): Promise<PromptImage[]> {
  if (!rows.length) return [];
  const { data, error } = await client.storage.from(bucket).createSignedUrls(
    rows.map((image) => image.storage_path),
    signedUrlTtl,
  );
  if (error) throw error;
  const urls = new Map(
    (data ?? []).flatMap((entry) =>
      entry.path && entry.signedUrl ? [[entry.path, entry.signedUrl] as const] : [],
    ),
  );
  return rows.map((image) => ({
    id: image.id,
    path: image.storage_path,
    role: image.role,
    position: image.position,
    label: image.label,
    url: urls.get(image.storage_path) ?? "",
  })).filter((image) => image.url).sort((a, b) => a.position - b.position);
}

async function mapPrompt(client: SupabaseClient, row: PromptRow): Promise<Prompt> {
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
    isFavorite: false,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    images: await signImages(client, row.prompt_images ?? []),
  };
}

const selection = "id,slug,creator_id,creator_name,creator_slug,title,content,description,category,model,status,created_at,updated_at,prompt_images(id,storage_path,role,position,label)";

export async function getPublicPrompts(limit = 24): Promise<Prompt[]> {
  const client = createPublicClient();
  if (!client) return [];
  const { data, error } = await client
    .from("prompts")
    .select(selection)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return Promise.all(((data ?? []) as unknown as PromptRow[]).map((row) => mapPrompt(client, row)));
}

export async function getPublicPrompt(slug: string): Promise<Prompt | null> {
  const client = createPublicClient();
  if (!client) return null;
  const { data, error } = await client
    .from("prompts")
    .select(selection)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? mapPrompt(client, data as unknown as PromptRow) : null;
}

export async function getPromptRecommendations(prompt: Prompt): Promise<{
  creatorPrompts: Prompt[];
  relatedPrompts: Prompt[];
}> {
  const client = createPublicClient();
  if (!client) return { creatorPrompts: [], relatedPrompts: [] };

  const creatorQuery = client.from("prompts").select(selection)
    .eq("status", "published").eq("creator_id", prompt.creatorId)
    .neq("id", prompt.id).order("created_at", { ascending: false }).limit(3);
  const categoryQuery = prompt.category
    ? client.from("prompts").select(selection)
      .eq("status", "published").eq("category", prompt.category)
      .neq("creator_id", prompt.creatorId).neq("id", prompt.id)
      .order("created_at", { ascending: false }).limit(3)
    : Promise.resolve({ data: [], error: null });

  const [creator, category] = await Promise.all([creatorQuery, categoryQuery]);
  // Recommendations are optional: a failed query must not hide the requested prompt.
  const mapRows = (rows: unknown) => Promise.all(
    ((rows ?? []) as PromptRow[]).map((row) => mapPrompt(client, row)),
  );
  const [creatorPrompts, relatedPrompts] = await Promise.all([
    creator.error ? [] : mapRows(creator.data),
    category.error ? [] : mapRows(category.data),
  ]);
  return { creatorPrompts, relatedPrompts };
}
