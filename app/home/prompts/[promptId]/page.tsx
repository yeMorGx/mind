import type { Metadata } from "next";
import LibraryPromptPage from "@/components/prompts/LibraryPromptPage";

export const metadata: Metadata = {
  title: "Seu prompt · Mind",
  robots: { index: false, follow: false },
};

export default async function PromptPage({ params, searchParams }: {
  params: Promise<{ promptId: string }>;
  searchParams: Promise<{edit?:string}>;
}) {
  const { promptId } = await params;
  return <LibraryPromptPage key={promptId} promptId={promptId} startEditing={(await searchParams).edit === "1"} />;
}
