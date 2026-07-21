import type { EiEventSignal } from "./events";
import { countByDomain } from "./events";
import type { CorrelationInsight } from "./types";

export function analyzeCrossDomain(
  signals: EiEventSignal[],
  now = new Date()
): CorrelationInsight[] {
  const counts = countByDomain(signals);
  const nowIso = now.toISOString();
  const insights: CorrelationInsight[] = [];

  if (counts.admissions > 0 && counts.finance > 0) {
    const ratio = counts.finance / Math.max(1, counts.admissions);
    insights.push({
      id: "corr-admissions-revenue",
      title: "Admissions ↔ Revenue",
      summary:
        ratio < 0.5
          ? "Admissions activity outpaces finance settlement — tuition follow-through may lag."
          : "Admissions and revenue signals are co-moving.",
      domains: ["admissions", "finance"],
      confidence: 0.66,
      explainability: {
        why: "Compared admissions vs finance EI event volumes.",
        evidence: [
          `${counts.admissions} admissions events`,
          `${counts.finance} finance events`,
          `ratio ${ratio.toFixed(2)}`,
        ],
        relatedEventIds: [],
        confidence: 0.66,
        lastUpdated: nowIso,
      },
    });
  }

  if (counts.students > 0 && counts.human_capital > 0) {
    insights.push({
      id: "corr-staffing-capacity",
      title: "Staffing ↔ Capacity",
      summary:
        counts.human_capital < counts.students / 3
          ? "Student activity is high relative to HCM events — capacity strain possible."
          : "Staffing signals appear aligned with student load.",
      domains: ["students", "human_capital"],
      confidence: 0.61,
      explainability: {
        why: "Student vs HCM EI density comparison.",
        evidence: [
          `${counts.students} student events`,
          `${counts.human_capital} HCM events`,
        ],
        relatedEventIds: [],
        confidence: 0.61,
        lastUpdated: nowIso,
      },
    });
  }

  if (counts.finance > 0 && counts.enrollment + counts.admissions > 0) {
    insights.push({
      id: "corr-finance-enrollment",
      title: "Finance ↔ Enrollment",
      summary: "Enrollment momentum and collections should be monitored together.",
      domains: ["finance", "enrollment"],
      confidence: 0.58,
      explainability: {
        why: "Joint presence of finance and enrollment/admissions EI.",
        evidence: [
          `${counts.finance} finance`,
          `${counts.enrollment + counts.admissions} enrollment/admissions`,
        ],
        relatedEventIds: [],
        confidence: 0.58,
        lastUpdated: nowIso,
      },
    });
  }

  if (counts.communications > 0 && counts.families + counts.students > 0) {
    insights.push({
      id: "corr-comms-retention",
      title: "Communications ↔ Retention",
      summary:
        counts.communications < 2
          ? "Family/student activity without strong outreach may hurt retention."
          : "Outreach volume is present alongside family/student activity.",
      domains: ["communications", "families"],
      confidence: 0.57,
      explainability: {
        why: "Communications volume vs family/student EI.",
        evidence: [
          `${counts.communications} communications`,
          `${counts.families + counts.students} family/student`,
        ],
        relatedEventIds: [],
        confidence: 0.57,
        lastUpdated: nowIso,
      },
    });
  }

  if (counts.documents > 0 && counts.human_capital + counts.finance > 0) {
    insights.push({
      id: "corr-documents-compliance",
      title: "Documents ↔ Compliance",
      summary: "Document activity co-occurs with HCM/finance — watch policy-locked packs.",
      domains: ["documents", "human_capital"],
      confidence: 0.6,
      explainability: {
        why: "Document EI alongside compliance-sensitive domains.",
        evidence: [
          `${counts.documents} document events`,
          `${counts.human_capital} HCM / ${counts.finance} finance`,
        ],
        relatedEventIds: [],
        confidence: 0.6,
        lastUpdated: nowIso,
      },
    });
  }

  const attendance = signals.filter((s) => s.eventType.includes("attendance"));
  if (attendance.length && counts.students > 0) {
    insights.push({
      id: "corr-attendance-outcomes",
      title: "Attendance ↔ Academic outcomes",
      summary: "Attendance signals present — correlate with academic risk follow-ups.",
      domains: ["students", "enrollment"],
      confidence: 0.63,
      explainability: {
        why: "Attendance EI within student domain activity.",
        evidence: [`${attendance.length} attendance-related events`],
        relatedEventIds: attendance.slice(0, 6).map((s) => s.id),
        confidence: 0.63,
        lastUpdated: nowIso,
      },
    });
  }

  return insights;
}
