import type {
  DecisionMemory,
  MemoryScope,
  OutcomeMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export function outcomeFromDecision(
  decision: DecisionMemory,
  actual: string,
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string
): OutcomeMemory {
  return {
    id: createId("outcome"),
    kind: "outcome",
    title: `Outcome: ${decision.title}`,
    summary: actual,
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    domains: decision.domains,
    tags: ["outcome"],
    confidence: decision.confidence,
    evidence: decision.evidence,
    retention: "permanent",
    sourceIds: [decision.id],
    metadata: {},
    relatedDecisionId: decision.id,
    expected: decision.expectedOutcome,
    actual,
    delta:
      decision.expectedOutcome && decision.expectedOutcome !== actual
        ? "Actual outcome differs from expected"
        : "Aligned with expected outcome",
  };
}
