"use client";
import type { MindUser } from "@/lib/backend";
import { accountHeaders } from "@/lib/billing/client";
export async function campaignRequest<T>(
  user: MindUser,
  action: "list" | "save" | "state",
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`/api/campaigns/${action}`, {
    method: "POST",
    headers: {
      ...(await accountHeaders(user)),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "Não foi possível carregar as campanhas.");
  return value;
}
