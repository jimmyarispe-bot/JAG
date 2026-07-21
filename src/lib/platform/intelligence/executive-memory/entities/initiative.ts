import type {
  DecisionMemory,
  InitiativeMemory,
  MemoryScope,
} from "@/lib/platform/intelligence/executive-memory/types";

export function initiativesFromDecisions(
  decisions: DecisionMemory[],
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string
): InitiativeMemory[] {
  return decisions
    .filter((d) => d.expectedOutcome || d.status === "proposed")
    .slice(0, 5)
    .map((d, i) => ({
      id: createId(`init-${i}`),
      kind: "initiative" as const,
      title: `Initiative: ${d.title}`,
      summary: d.expectedOutcome ?? d.summary,
      createdAt: nowIso,
      updatedAt: nowIso,
      scope,
      domains: d.domains,
      tags: ["initiative"],
      confidence: d.confidence,
      evidence: d.evidence,
      retention: "permanent" as const,
      sourceIds: [d.id],
      metadata: {},
      owner: d.owner,
      status: "proposed" as const,
      relatedDecisionIds: [d.id],
    }));
}
