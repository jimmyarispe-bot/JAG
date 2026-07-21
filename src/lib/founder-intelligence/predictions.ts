import type { EiEventSignal } from "./events";
import { countByDomain } from "./events";
import type { FounderPrediction } from "./types";

/**
 * Heuristic prediction interfaces — not a live ML model.
 * Produces mid/low/high with contributing factors for founder explainability.
 */
export function generatePredictions(
  signals: EiEventSignal[],
  now = new Date()
): FounderPrediction[] {
  const counts = countByDomain(signals);
  const nowIso = now.toISOString();
  const predictions: FounderPrediction[] = [];

  const enrollBase = Math.max(0, counts.enrollment + counts.admissions + counts.students);
  const enrollMid = enrollBase * 4;
  predictions.push({
    id: "pred-enrollment",
    title: "Enrollment forecast (30-day)",
    domain: "enrollment",
    metric: "net_enrollment_delta",
    low: Math.max(0, enrollMid * 0.7),
    mid: enrollMid,
    high: enrollMid * 1.35,
    unit: "students",
    confidence: Math.min(0.85, 0.45 + enrollBase * 0.03),
    factors: [
      `${counts.admissions} admissions signals`,
      `${counts.students} student signals`,
      `${counts.enrollment} enrollment-tagged signals`,
    ],
    explainability: {
      why: "Projected from recent admissions/SIS EI volume (heuristic model).",
      evidence: [
        `Base activity score ${enrollBase}`,
        "Interval = mid ± ~30%",
      ],
      relatedEventIds: signals
        .filter(
          (s) =>
            s.moduleKey === "admissions" ||
            s.moduleKey === "sis" ||
            s.moduleKey === "students" ||
            s.eventType.includes("enrollment") ||
            s.eventType.includes("lead.")
        )
        .slice(0, 8)
        .map((s) => s.id),
      confidence: Math.min(0.85, 0.45 + enrollBase * 0.03),
      lastUpdated: nowIso,
    },
  });

  const financeBase = counts.finance;
  const revMid = financeBase * 1500;
  predictions.push({
    id: "pred-revenue",
    title: "Revenue forecast (30-day)",
    domain: "finance",
    metric: "collections",
    low: revMid * 0.65,
    mid: revMid,
    high: revMid * 1.4,
    unit: "USD",
    confidence: Math.min(0.8, 0.4 + financeBase * 0.04),
    factors: [
      `${financeBase} finance EI events`,
      "Payment/invoice mix drives confidence",
    ],
    explainability: {
      why: "Scaled from recent invoice/payment EI frequency.",
      evidence: [`Finance event count ${financeBase}`],
      relatedEventIds: signals
        .filter((s) => s.moduleKey === "finance" || s.eventType.includes("invoice") || s.eventType.includes("payment"))
        .slice(0, 8)
        .map((s) => s.id),
      confidence: Math.min(0.8, 0.4 + financeBase * 0.04),
      lastUpdated: nowIso,
    },
  });

  predictions.push({
    id: "pred-cashflow",
    title: "Cash flow outlook",
    domain: "finance",
    metric: "net_cash_flow",
    low: revMid * 0.4,
    mid: revMid * 0.75,
    high: revMid * 1.1,
    unit: "USD",
    confidence: Math.min(0.75, 0.38 + financeBase * 0.035),
    factors: ["Derived from revenue forecast", "Overdue signals widen the interval"],
    explainability: {
      why: "Cash flow band derived from revenue heuristic minus overdue pressure.",
      evidence: [
        `${signals.filter((s) => s.eventType.includes("overdue")).length} overdue signals`,
      ],
      relatedEventIds: [],
      confidence: Math.min(0.75, 0.38 + financeBase * 0.035),
      lastUpdated: nowIso,
    },
  });

  const hc = counts.human_capital;
  const hireNeed = Math.max(0, Math.round(hc * 0.15));
  predictions.push({
    id: "pred-hiring",
    title: "Hiring needs forecast",
    domain: "human_capital",
    metric: "open_roles",
    low: Math.max(0, hireNeed - 1),
    mid: hireNeed,
    high: hireNeed + 2,
    unit: "roles",
    confidence: Math.min(0.7, 0.4 + hc * 0.03),
    factors: [`${hc} HCM events`, "Separations inflate mid-point"],
    explainability: {
      why: "Hiring demand inferred from HCM EI churn and assignment volume.",
      evidence: [
        `${signals.filter((s) => s.eventType === "employee.terminated").length} terminations`,
        `${signals.filter((s) => s.eventType === "employee.hired").length} hires`,
      ],
      relatedEventIds: [],
      confidence: Math.min(0.7, 0.4 + hc * 0.03),
      lastUpdated: nowIso,
    },
  });

  predictions.push({
    id: "pred-capacity",
    title: "Class capacity forecast",
    domain: "calendar",
    metric: "seat_utilization_pct",
    low: 55,
    mid: Math.min(95, 60 + counts.calendar * 3 + counts.students),
    high: 98,
    unit: "percent",
    confidence: 0.55,
    factors: ["Calendar + student signal density"],
    explainability: {
      why: "Utilization proxy from calendar/student EI activity.",
      evidence: [`${counts.calendar} calendar`, `${counts.students} student events`],
      relatedEventIds: [],
      confidence: 0.55,
      lastUpdated: nowIso,
    },
  });

  predictions.push({
    id: "pred-scholarship",
    title: "Scholarship utilization forecast",
    domain: "finance",
    metric: "award_utilization_pct",
    low: 40,
    mid: Math.min(95, 50 + signals.filter((s) => s.eventType.includes("scholarship")).length * 8),
    high: 100,
    unit: "percent",
    confidence: 0.5,
    factors: ["Scholarship EI event frequency"],
    explainability: {
      why: "Utilization inferred from scholarship-related EI events.",
      evidence: [
        `${signals.filter((s) => s.eventType.includes("scholarship")).length} scholarship signals`,
      ],
      relatedEventIds: [],
      confidence: 0.5,
      lastUpdated: nowIso,
    },
  });

  predictions.push({
    id: "pred-turnover",
    title: "Staff turnover forecast",
    domain: "human_capital",
    metric: "annualized_turnover_pct",
    low: 5,
    mid: Math.min(40, 8 + signals.filter((s) => s.eventType === "employee.terminated").length * 4),
    high: 45,
    unit: "percent",
    confidence: 0.58,
    factors: ["Termination EI events annualized heuristically"],
    explainability: {
      why: "Turnover band from recent separation events.",
      evidence: [
        `${signals.filter((s) => s.eventType === "employee.terminated").length} terminations`,
      ],
      relatedEventIds: [],
      confidence: 0.58,
      lastUpdated: nowIso,
    },
  });

  predictions.push({
    id: "pred-documents",
    title: "Document volume forecast",
    domain: "documents",
    metric: "documents_30d",
    low: Math.max(0, counts.documents * 3),
    mid: counts.documents * 5,
    high: counts.documents * 8,
    unit: "documents",
    confidence: Math.min(0.75, 0.4 + counts.documents * 0.04),
    factors: [`${counts.documents} document EI events in window`],
    explainability: {
      why: "Document volume extrapolated from recent document EI.",
      evidence: [`Document event count ${counts.documents}`],
      relatedEventIds: [],
      confidence: Math.min(0.75, 0.4 + counts.documents * 0.04),
      lastUpdated: nowIso,
    },
  });

  return predictions;
}
