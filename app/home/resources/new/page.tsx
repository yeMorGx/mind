import ResourceEditor from "@/components/resources/ResourceEditor";
export const metadata = { title: "New resource · Mind" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  return (
    <ResourceEditor
      key={kind === "mcp" ? "mcp" : "markdown"}
      kind={kind === "mcp" ? "mcp" : "markdown"}
    />
  );
}
