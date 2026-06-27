import type { TagCategory } from "@/lib/platform/tags/types";

/** Default system tag slugs seeded per organization in migration 132. */
export const SYSTEM_TAG_SLUGS = [
  "high-priority",
  "watch-list",
  "medicaid",
  "autism",
  "dyslexia",
  "iep",
  "504",
  "esa",
  "grant-funded",
  "boarding",
  "virtual",
  "hybrid",
  "international",
] as const;

export type SystemTagSlug = (typeof SYSTEM_TAG_SLUGS)[number];

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  priority: "Priority",
  medical: "Medical",
  learning: "Learning",
  funding: "Funding",
  program: "Program",
  demographic: "Demographic",
  compliance: "Compliance",
  custom: "Custom",
};
