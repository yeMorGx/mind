import Landing from "@/components/pages/Landing";
import { getPublicPrompts } from "@/lib/supabase/server-data";
import type { Prompt } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let prompts: Prompt[] = [];
  try {
    prompts = await getPublicPrompts(24);
  } catch {
    // The setup guide explains the required tables and storage bucket.
  }
  return <Landing initialPrompts={prompts} />;
}
