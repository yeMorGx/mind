import PublicCreator from "@/components/pages/PublicCreator";
export default async function Page({ params }: { params: Promise<{ creatorId: string }> }) { const { creatorId } = await params; return <PublicCreator key={creatorId} creatorId={creatorId} />; }
