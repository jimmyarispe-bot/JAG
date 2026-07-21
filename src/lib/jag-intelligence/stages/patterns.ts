import type { NormalizedEvent } from "../types";

/** Stage 5 — Pattern Detection */
export function stagePatternDetection(events: NormalizedEvent[]) {
  const byType = new Map<string, number>();
  for (const e of events) {
    byType.set(e.eventType, (byType.get(e.eventType) ?? 0) + 1);
  }

  const patterns: Array<{ id: string; title: string; summary: string; domain: string }> = [];
  for (const [eventType, count] of byType) {
    if (count < 3) continue;
    const sample = events.find((e) => e.eventType === eventType)!;
    patterns.push({
      id: `pattern-${eventType.replace(/\./g, "-")}`,
      title: `Recurring ${eventType}`,
      summary: `${count} occurrences of ${eventType} in the analysis window.`,
      domain: sample.domain,
    });
  }

  // Burst pattern: many high-severity in short window
  const high = events.filter((e) => e.severityRank >= 75);
  if (high.length >= 4) {
    patterns.push({
      id: "pattern-severity-burst",
      title: "Elevated severity burst",
      summary: `${high.length} high-severity signals clustered in the window.`,
      domain: "organization",
    });
  }

  return patterns;
}
