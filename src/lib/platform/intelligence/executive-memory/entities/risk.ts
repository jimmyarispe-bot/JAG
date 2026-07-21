import type {
  BriefingResultLight,
  MemoryScope,
  RiskMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export function risksFromBriefing(
  briefing: BriefingResultLight | undefined,
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string
): RiskMemory[] {
  const risks = briefing?.briefing?.sections?.topRisks ?? [];
  const overnightNew = briefing?.overnight?.newRisks ?? [];

  const fromCards = risks.map((r, i) => ({
    id: createId(`risk-${i}`),
    kind: "risk" as const,
    title: r.title ?? "Risk",
    summary: r.summary ?? r.title ?? "Risk signal",
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    domains: r.domains ?? [],
    tags: ["risk"],
    confidence: r.confidence ?? 0.6,
    evidence: [],
    retention: "permanent" as const,
    sourceIds: r.id ? [r.id] : [],
    metadata: {},
    severity: r.severity ?? 50,
    urgency: r.urgency ?? 50,
    status: (r.status as RiskMemory["status"]) ?? "open",
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
    recurrenceCount: 1,
  }));

  const fromOvernight = overnightNew.map((title, i) => ({
    id: createId(`risk-on-${i}`),
    kind: "risk" as const,
    title,
    summary: title,
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    domains: [],
    tags: ["risk", "overnight"],
    confidence: 0.55,
    evidence: [],
    retention: "archive" as const,
    sourceIds: [],
    metadata: {},
    severity: 60,
    urgency: 60,
    status: "open" as const,
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
    recurrenceCount: 1,
  }));

  return [...fromCards, ...fromOvernight];
}
