import PublicCreator from "@/components/pages/PublicCreator";
export default async function Page({ params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId: encodedId } = await params;
  // Next 16 can preserve %40 in dynamic segments, including client navigation.
  let creatorId = encodedId;
  try { creatorId = decodeURIComponent(encodedId); } catch { /* Keep invalid URLs in the profile's existing not-found state. */ }
  return <PublicCreator key={creatorId} creatorId={creatorId} />;
}
