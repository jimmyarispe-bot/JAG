import type {
  BriefingResultLight,
  MemoryScope,
  OpportunityMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export function opportunitiesFromBriefing(
  briefing: BriefingResultLight | undefined,
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string
): OpportunityMemory[] {
  const queue =
    briefing?.opportunityQueue ?? briefing?.briefing?.sections?.topOpportunities ?? [];
  return queue.map((o, i) => ({
    id: createId(`opp-${i}`),
    kind: "opportunity" as const,
    title: o.title ?? "Opportunity",
    summary: o.summary ?? o.title ?? "Opportunity signal",
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    domains: o.domains ?? [],
    tags: ["opportunity", o.category ?? "growth"],
    confidence: o.confidence ?? 0.55,
    evidence: [],
    retention: "archive" as const,
    sourceIds: o.id ? [o.id] : [],
    metadata: {},
    category: o.category ?? "growth",
    estimatedImpact: o.estimatedImpact ?? 50,
    status: "open" as const,
  }));
}
