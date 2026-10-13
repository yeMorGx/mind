import type { Metadata } from "next";
import LibraryPromptPage from "@/components/prompts/LibraryPromptPage";

export const metadata: Metadata = {
  title: "Seu prompt · Mind",
  robots: { index: false, follow: false },
};

export default async function PromptPage({ params }: {
  params: Promise<{ promptId: string }>;
}) {
  const { promptId } = await params;
  return <LibraryPromptPage key={promptId} promptId={promptId} />;
}
