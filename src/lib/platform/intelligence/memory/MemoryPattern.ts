/**
 * Advisory pattern detection over institutional memory — Sprint 204.
 */

import type { MemoryRecord } from "./MemoryRecord";

export const MEMORY_PATTERN_KINDS = [
  "funding_shortages",
  "enrollment_spikes",
  "teacher_turnover",
  "attendance_decline",
  "compliance_issues",
  "successful_interventions",
  "custom",
] as const;

export type MemoryPatternKind = (typeof MEMORY_PATTERN_KINDS)[number];

export type MemoryPattern = {
  readonly id: string;
  readonly kind: MemoryPatternKind;
  readonly label: string;
  readonly organizationId: string;
  readonly occurrenceCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly confidence: number;
  readonly memoryIds: readonly string[];
  readonly summary: string;
  readonly advisoryNotice: string;
};

const PATTERN_MATCHERS: readonly {
  kind: MemoryPatternKind;
  label: string;
  tags: readonly string[];
  titleRe: RegExp;
}[] = [
  {
    kind: "funding_shortages",
    label: "Funding shortages",
    tags: ["funding", "budget", "shortage"],
    titleRe: /funding|budget|shortfall|cut/i,
  },
  {
    kind: "enrollment_spikes",
    label: "Enrollment spikes",
    tags: ["enrollment", "growth"],
    titleRe: /enrollment|enroll|capacity surge/i,
  },
  {
    kind: "teacher_turnover",
    label: "Teacher turnover",
    tags: ["staffing", "teacher", "turnover"],
    titleRe: /teacher|staffing|turnover|attrition|hire/i,
  },
  {
    kind: "attendance_decline",
    label: "Attendance decline",
    tags: ["attendance"],
    titleRe: /attendance/i,
  },
  {
    kind: "compliance_issues",
    label: "Repeated compliance issues",
    tags: ["compliance", "policy"],
    titleRe: /compliance|policy|audit/i,
  },
  {
    kind: "successful_interventions",
    label: "Successful interventions",
    tags: ["intervention", "success"],
    titleRe: /intervention|stabiliz|remediat/i,
  },
];

function matchesPattern(
  record: MemoryRecord,
  matcher: (typeof PATTERN_MATCHERS)[number]
): boolean {
  const hay = `${record.title} ${record.description} ${record.tags.join(" ")} ${record.outcomeSummary ?? ""}`.toLowerCase();
  if (matcher.titleRe.test(hay)) return true;
  return matcher.tags.some((t) => record.tags.map((x) => x.toLowerCase()).includes(t));
}

export function detectMemoryPatterns(
  organizationId: string,
  records: readonly MemoryRecord[]
): readonly MemoryPattern[] {
  const orgRecords = records.filter((r) => r.organizationId === organizationId);
  const patterns: MemoryPattern[] = [];

  for (const matcher of PATTERN_MATCHERS) {
    const hits = orgRecords.filter((r) => matchesPattern(r, matcher));
    // successful_interventions prefers success outcomes
    const filtered =
      matcher.kind === "successful_interventions"
        ? hits.filter((r) => r.outcome === "success" || r.type === "lesson_learned")
        : hits;
    if (filtered.length < 2) continue;

    const successCount = filtered.filter((r) => r.outcome === "success").length;
    const failureCount = filtered.filter((r) => r.outcome === "failure").length;
    const avgConf =
      filtered.reduce((a, r) => a + r.confidence, 0) / filtered.length;
    const confidence = Number(
      Math.min(0.95, 0.35 + filtered.length * 0.08 + avgConf * 0.25).toFixed(3)
    );

    patterns.push({
      id: `pat-${organizationId}-${matcher.kind}`,
      kind: matcher.kind,
      label: matcher.label,
      organizationId,
      occurrenceCount: filtered.length,
      successCount,
      failureCount,
      confidence,
      memoryIds: filtered.map((r) => r.id),
      summary: `Advisory pattern: ${matcher.label} appears ${filtered.length} time(s) in institutional memory (${successCount} success / ${failureCount} failure).`,
      advisoryNotice:
        "Patterns are advisory institutional signals — not predictive certainty.",
    });
  }

  return patterns.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}
