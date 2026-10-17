import ResourceEditor from "@/components/resources/ResourceEditor";
export const metadata = { title: "Editar recurso · Mind" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceEditor key={id} id={id} kind="markdown" />;
}
