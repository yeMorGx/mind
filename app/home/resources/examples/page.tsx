import ResourceExamplesImport from "@/components/resources/ResourceExamplesImport";
export const metadata = { title: "Add examples to my account · Mind" };
export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string | string[] }> }) {
  const { kind } = await searchParams;
  return <ResourceExamplesImport kind={kind === "mcp" || kind === "markdown" ? kind : undefined}/>;
}
