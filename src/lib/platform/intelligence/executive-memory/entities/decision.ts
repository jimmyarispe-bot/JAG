import type {
  BriefingResultLight,
  DecisionMemory,
  MemoryScope,
} from "@/lib/platform/intelligence/executive-memory/types";

export function decisionsFromBriefing(
  briefing: BriefingResultLight | undefined,
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string
): DecisionMemory[] {
  const queue = briefing?.decisionQueue ?? briefing?.briefing?.sections?.decisionsWaiting ?? [];
  return queue.map((d, i) => ({
    id: createId(`decision-${i}`),
    kind: "decision" as const,
    title: d.title ?? d.decisionNeeded ?? "Decision needed",
    summary: d.why ?? d.recommendedDecision ?? d.decisionNeeded ?? "Executive decision pending",
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    domains: d.domains ?? [],
    tags: ["decision-queue"],
    confidence: d.confidence ?? 0.6,
    evidence: [],
    retention: "permanent" as const,
    sourceIds: d.id ? [d.id] : [],
    metadata: {},
    decision: d.decisionNeeded ?? d.title ?? "Decision needed",
    alternatives: [],
    expectedOutcome: d.recommendedDecision,
    status: "proposed" as const,
  }));
}
