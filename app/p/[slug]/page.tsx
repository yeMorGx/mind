import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicPromptPage from "@/components/marketplace/PublicPromptPage";
import { getPublicPrompt, getPromptRecommendations, getPublicCreatorProfile } from "@/lib/supabase/server-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const prompt = await getPublicPrompt(slug);
    if (!prompt) return { title: "Prompt not found · Mind" };
    const description = prompt.description || prompt.content.slice(0, 150);
    const cover = prompt.images.find((image) => image.role === "gallery")
      ?? prompt.images.find((image) => image.role === "after")
      ?? prompt.images[0];
    return {
      title: `${prompt.title} · Mind`,
      description,
      openGraph: {
        title: prompt.title,
        description,
        type: "article",
        images: cover?.url.startsWith("https://") ? [{ url: cover.url, alt: prompt.title }] : [],
      },
      twitter: {
        card: cover ? "summary_large_image" : "summary",
        title: prompt.title,
        description,
        images: cover?.url.startsWith("https://") ? [cover.url] : [],
      },
    };
  } catch {
    return { title: "Mind · prompts for AI creators" };
  }
}

export default async function PromptPage({ params }: Props) {
  const { slug } = await params;
  const prompt = await getPublicPrompt(slug);
  if (!prompt) notFound();
  const recommendations = await getPromptRecommendations(prompt).catch(() => ({
    creatorPrompts: [], relatedPrompts: [],
  }));
  const creator = await getPublicCreatorProfile(prompt.creatorId);
  return <PublicPromptPage key={prompt.id} prompt={prompt} creatorProfile={creator ?? undefined} creatorHref={`/u/${prompt.creatorId}`} {...recommendations} />;
}
