import { notFound } from "next/navigation";
import SettingsPage, { type SettingsSection } from "@/components/pages/SettingsPage";
export const metadata = { title: "Settings · Mind", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{section: string}> }) {
  const { section } = await params;
  if (!["appearance","connections","security","preferences","billing","data"].includes(section)) notFound();
  return <SettingsPage section={section as SettingsSection}/>;
}
