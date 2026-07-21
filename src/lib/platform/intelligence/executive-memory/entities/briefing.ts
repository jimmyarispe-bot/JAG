import type {
  BriefingMemory,
  BriefingResultLight,
  MemoryScope,
} from "@/lib/platform/intelligence/executive-memory/types";

export function briefingArchiveFromResult(
  briefing: BriefingResultLight | undefined,
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string,
  periodLabel?: string
): BriefingMemory | null {
  if (!briefing?.briefing && !briefing?.overnight) return null;
  const summary =
    briefing.briefing?.sections?.executiveSummary ??
    briefing.overnight?.summary ??
    "Executive briefing archived";
  const period =
    periodLabel?.toLowerCase().includes("quarter")
      ? "quarterly"
      : periodLabel?.toLowerCase().includes("month")
        ? "monthly"
        : periodLabel?.toLowerCase().includes("week")
          ? "weekly"
          : "daily";

  return {
    id: createId("brief-archive"),
    kind: "briefing",
    title: `Executive brief ${period}`,
    summary,
    createdAt: briefing.generatedAt ?? nowIso,
    updatedAt: nowIso,
    scope,
    domains: briefing.contributingDomains ?? [],
    tags: ["brief-archive", period],
    confidence: briefing.briefing?.explainability?.confidence ?? 0.65,
    evidence: [],
    retention: "archive",
    sourceIds: briefing.briefing?.id ? [briefing.briefing.id] : [],
    metadata: { requestId: briefing.requestId },
    period,
    greeting: briefing.briefing?.greeting,
    executiveSummary: summary,
    briefingId: briefing.briefing?.id,
  };
}
