import type {
  DecisionMemory,
  LessonMemory,
  MemoryScope,
  OutcomeMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export function lessonFromOutcome(
  decision: DecisionMemory,
  outcome: OutcomeMemory,
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string
): LessonMemory {
  const aligned = outcome.delta?.toLowerCase().includes("aligned");
  return {
    id: createId("lesson"),
    kind: "lesson",
    title: `Lesson: ${decision.title}`,
    summary: outcome.actual,
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    domains: decision.domains,
    tags: ["lesson-learned"],
    confidence: Math.min(decision.confidence, 0.85),
    evidence: outcome.evidence,
    retention: "permanent",
    sourceIds: [decision.id, outcome.id],
    metadata: {},
    whatHappened: decision.summary,
    decisionMade: decision.decision,
    expectedOutcome: decision.expectedOutcome,
    actualOutcome: outcome.actual,
    repeat: aligned
      ? ["Repeat the decision process and evidence standard"]
      : ["Keep multi-domain evidence packs before deciding"],
    change: aligned
      ? ["Monitor recurrence signals earlier"]
      : ["Adjust expected-outcome assumptions", "Tighten follow-up ownership"],
  };
}
