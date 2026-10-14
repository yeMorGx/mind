import type { BadgeKind } from "@/lib/firebase/badges";
export type OnboardingData = {
  name: string;
  email: string;
  role: string;
  source: string;
  usageType: "individual" | "team" | "";
  teamName: string;
  teamSize: string;
  invitedEmails: string[];
  creatorName: string;
  creatorIcon: string;
  creatorSlug: string;
  onboardingComplete: boolean;
};

export type PromptImageRole = "gallery" | "reference" | "before" | "after";

export type PromptImage = {
  id: string;
  path: string;
  url: string;
  role: PromptImageRole;
  position: number;
  label: string;
};

export type PromptImageInput = {
  id?: string;
  path?: string;
  url?: string;
  file?: File;
  role: PromptImageRole;
  position: number;
  label: string;
};

export type PromptStatus = "draft" | "published";

export type Prompt = {
  id: string;
  slug: string;
  creatorId: string;
  creatorName: string;
  creatorSlug: string;
  creatorAvatarUrl?: string;
  creatorBadges?: BadgeKind[];
  title: string;
  content: string;
  description: string;
  category: string;
  model: string;
  status: PromptStatus;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  images: PromptImage[];
};

export type PromptDraft = {
  title: string;
  content: string;
  description: string;
  category: string;
  model: string;
  status: PromptStatus;
  images: PromptImageInput[];
};
