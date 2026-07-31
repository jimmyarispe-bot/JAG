import type {
  DecisionCategory,
  DecisionPriority,
  DecisionSeverity,
} from "@/lib/executive-intelligence/decisions/types";

/** Static recommended processes — never AI-generated. */
export const RECOMMENDED_PROCESS_BY_CATEGORY: Readonly<
  Record<DecisionCategory, string>
> = {
  Finance:
    "1) Confirm connector sync health. 2) Review related financial evidence. 3) Assign Finance owner. 4) Resolve gaps, then close.",
  Operations:
    "1) Inspect pipeline/connector health. 2) Clear blockers or retry failed jobs. 3) Assign Ops owner. 4) Confirm recovery, then close.",
  Knowledge:
    "1) Open Evidence Catalog™ / Knowledge Graph™. 2) Add missing relationships or classifications. 3) Assign Knowledge owner. 4) Verify links, then close.",
  Organization:
    "1) Confirm organizational coverage (BU/department). 2) Update evidence tags or requirements. 3) Assign org owner. 4) Re-check coverage, then close.",
  Compliance:
    "1) Identify the compliance gap. 2) Collect supporting evidence. 3) Assign compliance owner. 4) Document remediation, then close.",
  Manual:
    "1) Clarify the decision objective. 2) Attach supporting evidence. 3) Assign an owner. 4) Track to resolution, then close.",
};

export function priorityFromSeverity(
  severity: DecisionSeverity
): DecisionPriority {
  if (severity === "Critical") return "P1";
  if (severity === "Warning") return "P2";
  return "P3";
}

export function defaultDueDateIso(
  severity: DecisionSeverity,
  from: Date = new Date()
): string {
  const days = severity === "Critical" ? 2 : severity === "Warning" ? 7 : 14;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Insights at/above this severity become Decision Center items. */
export const INSIGHT_DECISION_MIN_SEVERITY: DecisionSeverity = "Warning";
