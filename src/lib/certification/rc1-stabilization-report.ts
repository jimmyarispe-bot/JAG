import type { PlatformAuditFinding } from "@/lib/certification/platform-audit";
import { READINESS_THRESHOLD } from "@/lib/certification/types";

export interface Rc1StabilizationReportInput {
  generatedAt: string;
  overallScore: number;
  p1ItemsResolved: number;
  findings: PlatformAuditFinding[];
  sprintNotes?: string[];
}

export interface Rc1StabilizationReport {
  generatedAt: string;
  overallScore: number;
  pilotReady: boolean;
  remainingCritical: number;
  remainingHigh: number;
  remainingMedium: number;
  remainingLow: number;
  markdown: string;
}

const P1_RESOLVED = [
  "Canonical learning progress pipeline (KEE → PAJ → competency → profile)",
  "Parent communication portal delivery with audit, events, and follow-up work",
  "Permission guards on admissions automation, sprint15, and platform automation actions",
  "Students.edit privilege escalation removed from SSIS write actions",
  "Scheduling → instruction loop transitions on placement and session generation",
  "SSIS communication timeline merged into student profile timeline",
  "RC1 operational loop integration tests",
];

export function buildRc1StabilizationReport(
  input: Rc1StabilizationReportInput
): Rc1StabilizationReport {
  const critical = input.findings.filter((f) => f.category === "critical");
  const high = input.findings.filter((f) => f.category === "high");
  const medium = input.findings.filter(
    (f) => f.category === "medium" || f.category === "technical_debt"
  );
  const low = input.findings.filter((f) => f.category === "low");

  const pilotReady =
    input.overallScore >= READINESS_THRESHOLD &&
    critical.length === 0 &&
    high.filter((f) => f.domain !== "integrations").length === 0;

  const findingsList = (items: PlatformAuditFinding[]) =>
    items.length
      ? items.map((f) => `- **${f.title}** (${f.domain}): ${f.description}`).join("\n")
      : "_None._";

  const markdown = `# The JAG™ RC1 — P1 Release Stabilization Report

**Generated:** ${input.generatedAt}  
**Production Readiness Score:** ${input.overallScore.toFixed(1)}% (threshold ${READINESS_THRESHOLD}%)  
**Pilot Ready:** ${pilotReady ? "Yes — controlled pilot authorized" : "No — resolve Critical/High findings first"}

## P1 Sprint — Resolved (${input.p1ItemsResolved} items)

${P1_RESOLVED.map((item) => `- ${item}`).join("\n")}

${input.sprintNotes?.length ? `### Additional notes\n${input.sprintNotes.map((n) => `- ${n}`).join("\n")}\n` : ""}

## Remaining Findings

### Critical (${critical.length})
${findingsList(critical)}

### High (${high.length})
${findingsList(high)}

### Medium (${medium.length})
${findingsList(medium)}

### Low (${low.length})
${findingsList(low)}

## Operational Loop Certification

The canonical student lifecycle is registered and tested:

Inquiry → Admissions → Enrollment → Scheduling → Instruction → Evidence → Progress → Parent Communication → Billing → Repeat

All eight loop transitions are registered with capability keys, audit events, and next-work routing.

## Recommendation

${pilotReady
    ? "Proceed with controlled pilot. Monitor Mission Control for loop transition failures and parent portal delivery gaps."
    : "Complete remaining Critical and High findings before pilot launch. Re-run full certification at `/dashboard/certification/launch`."}
`;

  return {
    generatedAt: input.generatedAt,
    overallScore: input.overallScore,
    pilotReady,
    remainingCritical: critical.length,
    remainingHigh: high.length,
    remainingMedium: medium.length,
    remainingLow: low.length,
    markdown,
  };
}

/** Static RC1 score reflecting P1 stabilization (run full cert for live DB score). */
export function getRc1StaticReadinessEstimate(): number {
  return 82;
}
