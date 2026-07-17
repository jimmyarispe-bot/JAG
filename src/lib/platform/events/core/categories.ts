import type { EventCategory } from "@/lib/platform/events/types";
import { EVENT_CATEGORIES } from "@/lib/platform/events/types";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  identity: "Identity Events",
  organization: "Organization Events",
  security: "Security Events",
  audit: "Audit Events",
  workflow: "Workflow Events",
  billing: "Billing Events",
  knowledge_graph: "Knowledge Graph Events",
  executive_graph: "Executive Graph Events",
  ai: "AI Events",
  marketplace: "Marketplace Events",
  connector: "Connector Events",
  application: "Application Events",
};

export function isEventCategory(value: string): value is EventCategory {
  return (EVENT_CATEGORIES as readonly string[]).includes(value);
}

export function listEventCategories(): readonly EventCategory[] {
  return EVENT_CATEGORIES;
}
