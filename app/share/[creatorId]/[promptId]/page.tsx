import PublicCreator from "@/components/pages/PublicCreator";
export default async function Page({ params }: { params: Promise<{ creatorId: string; promptId: string }> }) { const { creatorId, promptId } = await params; return <PublicCreator key={`${creatorId}:${promptId}`} creatorId={creatorId} promptId={promptId} />; }
