import { notFound } from "next/navigation";
import ResourceDetail from "@/components/resources/ResourceDetail";
import { getPublicResource } from "@/lib/supabase/resource-server";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const resource = await getPublicResource(id).catch(() => null);
  return {
    title: resource ? `${resource.document.title} · Mind` : "Recurso · Mind",
    description: resource?.document.summary,
  };
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const resource = await getPublicResource(id);
  if (!resource) notFound();
  return <ResourceDetail resource={resource} />;
}
