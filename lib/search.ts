import { requireSupabaseClient } from "@/lib/supabase/client";
import { searchCreators, type CreatorSearchResult } from "@/lib/supabase/creators";
export type PromptSuggestion = { creator_id: string; prompt_id: string; title: string; description: string; model: string; creator_name: string };
export type SearchSuggestions = { prompts: PromptSuggestion[]; people: CreatorSearchResult[]; failed: boolean };
export async function getSearchSuggestions(query: string, signal: AbortSignal): Promise<SearchSuggestions> {
  const term = query.trim().slice(0,80);
  const [prompts, people] = await Promise.allSettled([
    term.startsWith("@") ? Promise.resolve([] as PromptSuggestion[]) : requireSupabaseClient().rpc("mind_search_prompts",{ search_term: term,result_limit:5 }).abortSignal(signal).then(({data,error}) => { if (error) throw error; return (data ?? []) as PromptSuggestion[]; }),
    searchCreators(term,signal),
  ]);
  return { prompts:prompts.status === "fulfilled" ? prompts.value : [],people:people.status === "fulfilled" ? people.value.slice(0,4) : [],failed:prompts.status === "rejected" || people.status === "rejected" };
}
