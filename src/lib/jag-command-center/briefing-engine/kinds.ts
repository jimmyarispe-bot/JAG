/**
 * Briefing kinds — same engine, different emphasis and section order.
 */

import type { JagBriefingKind, JagBriefingSectionId } from "./types";

export const JAG_BRIEFING_KIND_LABELS: Record<JagBriefingKind, string> = {
  morning_brief: "Morning Brief",
  weekly_executive_review: "Weekly Executive Review",
  monthly_board_report: "Monthly Board Report",
  quarterly_strategic_review: "Quarterly Strategic Review",
  operational_incident_brief: "Operational Incident Brief",
  funding_brief: "Funding Brief",
  student_success_brief: "Student Success Brief",
  compliance_brief: "Compliance Brief",
  risk_brief: "Risk Brief",
};

const BASE_ORDER: readonly JagBriefingSectionId[] = [
  "executive_summary",
  "what_happened",
  "why_it_happened",
  "decide_today",
  "if_i_do_nothing",
  "watch_next",
  "todays_priorities",
  "critical_risks",
  "opportunities",
  "decision_queue_summary",
  "completed_outcomes",
  "emerging_trends",
  "forecast",
  "scenario_analysis",
  "historical_context",
  "recommended_executive_actions",
  "executive_insights",
  "appendix",
];

/** Section order overrides by kind (must include all ids eventually via merge). */
const KIND_PRIORITY: Partial<
  Record<JagBriefingKind, readonly JagBriefingSectionId[]>
> = {
  morning_brief: [
    "executive_summary",
    "decide_today",
    "what_happened",
    "todays_priorities",
    "forecast",
    "if_i_do_nothing",
    "watch_next",
  ],
  weekly_executive_review: [
    "executive_summary",
    "what_happened",
    "why_it_happened",
    "decision_queue_summary",
    "completed_outcomes",
    "forecast",
    "scenario_analysis",
    "historical_context",
    "decide_today",
  ],
  monthly_board_report: [
    "executive_summary",
    "what_happened",
    "completed_outcomes",
    "forecast",
    "opportunities",
    "critical_risks",
    "recommended_executive_actions",
  ],
  quarterly_strategic_review: [
    "executive_summary",
    "emerging_trends",
    "forecast",
    "opportunities",
    "critical_risks",
    "why_it_happened",
    "watch_next",
  ],
  operational_incident_brief: [
    "executive_summary",
    "what_happened",
    "why_it_happened",
    "critical_risks",
    "forecast",
    "decide_today",
    "if_i_do_nothing",
  ],
  funding_brief: [
    "executive_summary",
    "forecast",
    "opportunities",
    "critical_risks",
    "decide_today",
    "recommended_executive_actions",
  ],
  student_success_brief: [
    "executive_summary",
    "what_happened",
    "emerging_trends",
    "forecast",
    "opportunities",
    "decide_today",
  ],
  compliance_brief: [
    "executive_summary",
    "critical_risks",
    "forecast",
    "why_it_happened",
    "decide_today",
    "if_i_do_nothing",
  ],
  risk_brief: [
    "executive_summary",
    "critical_risks",
    "forecast",
    "if_i_do_nothing",
    "decide_today",
    "watch_next",
    "recommended_executive_actions",
  ],
};

export function briefingKindLabel(kind: JagBriefingKind): string {
  return JAG_BRIEFING_KIND_LABELS[kind];
}

export function sectionOrderForKind(
  kind: JagBriefingKind
): readonly JagBriefingSectionId[] {
  const priority = KIND_PRIORITY[kind] ?? [];
  const seen = new Set<JagBriefingSectionId>();
  const ordered: JagBriefingSectionId[] = [];
  for (const id of priority) {
    if (!seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  for (const id of BASE_ORDER) {
    if (!seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  return ordered;
}

export function narrativeEmphasis(kind: JagBriefingKind): string {
  switch (kind) {
    case "morning_brief":
      return "Morning emphasis: decide today and overnight changes.";
    case "weekly_executive_review":
      return "Weekly emphasis: queue progress and closed outcomes.";
    case "monthly_board_report":
      return "Board emphasis: outcomes, opportunities, and accountable risks.";
    case "quarterly_strategic_review":
      return "Quarterly emphasis: trends, strategy, and watch items.";
    case "operational_incident_brief":
      return "Incident emphasis: what happened, why, and immediate decisions.";
    case "funding_brief":
      return "Funding emphasis: readiness, opportunities, and financial risks.";
    case "student_success_brief":
      return "Student success emphasis: trajectories and support decisions.";
    case "compliance_brief":
      return "Compliance emphasis: policy-linked risks and required decisions.";
    case "risk_brief":
      return "Risk emphasis: critical exposures and cost of inaction.";
  }
}

/** Contributor id substrings emphasized for specialized briefs. */
export function emphasizedContributorHints(
  kind: JagBriefingKind
): readonly string[] {
  switch (kind) {
    case "funding_brief":
      return ["funding", "scholarship"];
    case "student_success_brief":
      return ["student_success", "attendance", "progress", "intervention"];
    case "compliance_brief":
      return ["compliance", "policy"];
    case "operational_incident_brief":
      return ["operational", "staffing", "capacity", "scheduling"];
    case "risk_brief":
      return ["school_health", "compliance", "funding"];
    default:
      return [];
  }
}
