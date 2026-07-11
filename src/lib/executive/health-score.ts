/**
 * Sprint 003 — Executive Health Score (EHS).
 * Deterministic 0–100 organizational health from live KPIs + trends (no AI, no I/O).
 */
import type { ExecutiveKPIs } from "@/lib/executive/kpis";
import type { ExecutiveTrends, ExecutiveMetricTrend } from "@/lib/executive/trends";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";

export type ExecutiveHealthGrade = "A" | "B" | "C" | "D" | "F";

export type ExecutiveHealthStatus =
  | "Excellent"
  | "Healthy"
  | "Needs Attention"
  | "Critical";

export type ExecutiveHealthDomain =
  | "enrollment"
  | "admissions"
  | "revenue"
  | "collections"
  | "staff"
  | "teacherAttendance"
  | "studentAttendance"
  | "operations"
  | "alerts"
  | "trendMomentum";

export interface ExecutiveHealthContributor {
  domain: ExecutiveHealthDomain;
  label: string;
  weight: number;
  score: number;
  weightedPoints: number;
}

export interface ExecutiveHealthScore {
  score: number;
  grade: ExecutiveHealthGrade;
  status: ExecutiveHealthStatus;
  contributors: ExecutiveHealthContributor[];
  strengths: string[];
  risks: string[];
}

/** Domain weights (sum = 100). Trend momentum applied separately as ±10. */
const DOMAIN_WEIGHTS: Record<Exclude<ExecutiveHealthDomain, "trendMomentum">, number> = {
  enrollment: 10,
  admissions: 10,
  revenue: 20,
  collections: 15,
  staff: 10,
  teacherAttendance: 10,
  studentAttendance: 10,
  operations: 5,
  alerts: 10,
};

const DOMAIN_LABELS: Record<ExecutiveHealthDomain, string> = {
  enrollment: "Enrollment",
  admissions: "Admissions",
  revenue: "Revenue",
  collections: "Collections",
  staff: "Staffing",
  teacherAttendance: "Teacher Attendance",
  studentAttendance: "Student Attendance",
  operations: "Operations",
  alerts: "Executive Alerts",
  trendMomentum: "Trend Momentum",
};

const TREND_MOMENTUM_CAP = 10;

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function round0(n: number): number {
  return Math.round(n);
}

function trendFor(
  trends: ExecutiveTrends,
  metric: ExecutiveMetricTrend["metric"]
): ExecutiveMetricTrend | undefined {
  return trends.metrics.find((m) => m.metric === metric);
}

function applyTrendAdjust(
  base: number,
  trend: ExecutiveMetricTrend | undefined,
  improve = 12,
  decline = 15
): number {
  if (!trend || trend.status === "UNCHANGED") return base;
  if (trend.status === "IMPROVING") return clamp(base + improve);
  return clamp(base - decline);
}

function scoreEnrollment(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  if (kpis.enrollment <= 0) return 0;
  return applyTrendAdjust(82, trendFor(trends, "enrollment"));
}

function scoreAdmissions(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  const base = kpis.admissions <= 0 ? 45 : 78;
  return applyTrendAdjust(base, trendFor(trends, "admissions"));
}

function scoreRevenue(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  if (kpis.revenue <= 0) return applyTrendAdjust(25, trendFor(trends, "revenue"), 8, 10);
  return applyTrendAdjust(85, trendFor(trends, "revenue"));
}

/** Collections health from outstanding vs revenue (lower AR share = healthier). */
function scoreCollections(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  let base: number;
  if (kpis.outstanding <= 0) {
    base = 100;
  } else if (kpis.revenue <= 0) {
    base = 28;
  } else {
    const share = kpis.outstanding / (kpis.outstanding + kpis.revenue);
    base = clamp(round0((1 - share) * 100));
  }
  // Outstanding DOWN = collections IMPROVING
  return applyTrendAdjust(base, trendFor(trends, "outstanding"));
}

function scoreStaff(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  if (kpis.staff <= 0) return 0;
  return applyTrendAdjust(80, trendFor(trends, "staff"), 10, 12);
}

function scoreTeacherAttendance(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  // No sessions today → neutral (avoid punishing empty calendar days).
  if (kpis.teacherAttendanceDetail.total <= 0) return 70;
  return applyTrendAdjust(
    clamp(kpis.teacherAttendance),
    trendFor(trends, "teacherAttendance"),
    8,
    12
  );
}

function scoreStudentAttendance(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  if (kpis.studentAttendanceDetail.total <= 0) return 70;
  return applyTrendAdjust(
    clamp(kpis.studentAttendance),
    trendFor(trends, "studentAttendance"),
    8,
    12
  );
}

function scoreOperations(kpis: ExecutiveKPIs): number {
  let score = kpis.upcomingClasses.length > 0 ? 88 : 38;
  const unsubmitted = kpis.studentAttendanceDetail.unsubmittedClassrooms;
  if (unsubmitted > 0) {
    score -= Math.min(30, unsubmitted * 8);
  }
  if (
    kpis.teacherAttendanceDetail.total > 0 &&
    kpis.teacherAttendanceDetail.missingPct > 20
  ) {
    score -= 15;
  }
  return clamp(score);
}

function scoreAlerts(kpis: ExecutiveKPIs, trends: ExecutiveTrends): number {
  if (kpis.alerts.length === 0) {
    return applyTrendAdjust(100, trendFor(trends, "alerts"), 0, 10);
  }
  let score = 100;
  for (const alert of kpis.alerts) {
    score -= alert.severity === "critical" ? 28 : alert.severity === "high" ? 18 : 10;
  }
  return applyTrendAdjust(clamp(score), trendFor(trends, "alerts"), 8, 12);
}

/**
 * Trend momentum: ± up to 10 points from improving vs declining metrics.
 * Listed as "Trend Momentum 10%" in the spec — applied as a post-weight bonus.
 */
function scoreTrendMomentum(trends: ExecutiveTrends): number {
  const scored = trends.metrics.filter((m) => m.previous != null);
  if (!scored.length) return 50; // neutral mid when no history

  const improving = scored.filter((m) => m.status === "IMPROVING").length;
  const declining = scored.filter((m) => m.status === "DECLINING").length;
  const net = improving - declining;
  // Map net into 0–100 centered at 50 (each net step ±12.5, capped).
  return clamp(50 + net * 12.5);
}

function trendMomentumPoints(momentumScore: number): number {
  // Convert 0–100 momentum score to −10…+10 contribution.
  return round0(((momentumScore - 50) / 50) * TREND_MOMENTUM_CAP);
}

function gradeFromScore(score: number): ExecutiveHealthGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function statusFromGrade(grade: ExecutiveHealthGrade): ExecutiveHealthStatus {
  switch (grade) {
    case "A":
      return "Excellent";
    case "B":
      return "Healthy";
    case "C":
    case "D":
      return "Needs Attention";
    case "F":
      return "Critical";
  }
}

function buildStrengths(
  kpis: ExecutiveKPIs,
  trends: ExecutiveTrends,
  domainScores: Record<string, number>,
  snapshot: KpiSnapshotRecord[]
): string[] {
  const strengths: string[] = [];

  const revenueSnap = snapshot.find(
    (s) =>
      s.metricId === "finance.monthly_revenue" || s.metricId === "finance.total_collected"
  );
  const revenueTrend = trendFor(trends, "revenue");
  if (
    revenueSnap?.metricValue != null &&
    kpis.revenue > revenueSnap.metricValue
  ) {
    strengths.push("Revenue exceeded prior snapshot");
  } else if (revenueTrend?.status === "IMPROVING") {
    strengths.push("Revenue exceeded target");
  }

  if (trendFor(trends, "studentAttendance")?.status === "IMPROVING") {
    strengths.push("Attendance improved");
  } else if (trendFor(trends, "teacherAttendance")?.status === "IMPROVING") {
    strengths.push("Teacher attendance improved");
  }

  if (trendFor(trends, "outstanding")?.status === "IMPROVING") {
    strengths.push("Collections increased");
  }

  if (kpis.enrollment > 0 && trendFor(trends, "enrollment")?.status === "IMPROVING") {
    strengths.push("Enrollment growing");
  }

  if (kpis.alerts.length === 0 && (domainScores.alerts ?? 0) >= 90) {
    strengths.push("No open executive alerts");
  }

  if (kpis.upcomingClasses.length > 0 && (domainScores.operations ?? 0) >= 80) {
    strengths.push("Instructional schedule is populated");
  }

  // Fall back to top domain scores.
  if (!strengths.length) {
    const top = Object.entries(domainScores)
      .filter(([key]) => key !== "trendMomentum")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    for (const [key, score] of top) {
      if (score >= 80) {
        strengths.push(
          `${DOMAIN_LABELS[key as ExecutiveHealthDomain]} is strong (${score}/100)`
        );
      }
    }
  }

  return [...new Set(strengths)].slice(0, 5);
}

function buildRisks(
  kpis: ExecutiveKPIs,
  trends: ExecutiveTrends,
  domainScores: Record<string, number>
): string[] {
  const risks: string[] = [];

  if (trendFor(trends, "admissions")?.status === "DECLINING") {
    risks.push("Admissions declining");
  }
  if (trendFor(trends, "outstanding")?.status === "DECLINING") {
    risks.push("Outstanding balances rising");
  }
  if (kpis.alerts.some((a) => a.type === "overdue_payroll")) {
    risks.push("Payroll overdue");
  }
  if (
    (kpis.studentAttendanceDetail.total > 0 && kpis.studentAttendance < 90) ||
    (kpis.teacherAttendanceDetail.total > 0 && kpis.teacherAttendance < 95)
  ) {
    risks.push("Low attendance");
  }
  if (kpis.enrollment === 0) {
    risks.push("Enrollment at zero");
  }
  if (kpis.revenue === 0) {
    risks.push("No revenue collected this month");
  }
  if (kpis.upcomingClasses.length === 0) {
    risks.push("No upcoming classes scheduled");
  }
  if (kpis.alerts.some((a) => a.severity === "critical")) {
    risks.push("Critical executive alerts open");
  }

  // Domain score risks.
  if ((domainScores.collections ?? 100) < 50) {
    risks.push("Collections under pressure");
  }
  if ((domainScores.staff ?? 100) < 40) {
    risks.push("Staffing levels are low");
  }

  return [...new Set(risks)].slice(0, 6);
}

export interface CalculateExecutiveHealthScoreInput {
  kpis: ExecutiveKPIs;
  trends: ExecutiveTrends;
  /** Most recent snapshot rows (optional — used for strength phrasing only). */
  previousSnapshot?: KpiSnapshotRecord[];
}

/**
 * Calculate Executive Health Score from live KPIs + trend engine output.
 * Pure / deterministic — no database calls.
 */
export function calculateExecutiveHealthScore(
  input: CalculateExecutiveHealthScoreInput
): ExecutiveHealthScore {
  const { kpis, trends, previousSnapshot = [] } = input;

  const rawScores: Record<Exclude<ExecutiveHealthDomain, "trendMomentum">, number> = {
    enrollment: scoreEnrollment(kpis, trends),
    admissions: scoreAdmissions(kpis, trends),
    revenue: scoreRevenue(kpis, trends),
    collections: scoreCollections(kpis, trends),
    staff: scoreStaff(kpis, trends),
    teacherAttendance: scoreTeacherAttendance(kpis, trends),
    studentAttendance: scoreStudentAttendance(kpis, trends),
    operations: scoreOperations(kpis),
    alerts: scoreAlerts(kpis, trends),
  };

  const contributors: ExecutiveHealthContributor[] = (
    Object.keys(DOMAIN_WEIGHTS) as Array<keyof typeof DOMAIN_WEIGHTS>
  ).map((domain) => {
    const weight = DOMAIN_WEIGHTS[domain];
    const score = rawScores[domain];
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      weight,
      score,
      weightedPoints: round0((score * weight) / 100),
    };
  });

  const baseScore = contributors.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0);

  const momentumScore = scoreTrendMomentum(trends);
  const momentumDelta = trendMomentumPoints(momentumScore);

  contributors.push({
    domain: "trendMomentum",
    label: DOMAIN_LABELS.trendMomentum,
    weight: TREND_MOMENTUM_CAP,
    score: momentumScore,
    weightedPoints: momentumDelta,
  });

  const score = clamp(round0(baseScore + momentumDelta));
  const grade = gradeFromScore(score);
  const status = statusFromGrade(grade);

  const domainScores: Record<string, number> = {
    ...rawScores,
    trendMomentum: momentumScore,
  };

  return {
    score,
    grade,
    status,
    contributors,
    strengths: buildStrengths(kpis, trends, domainScores, previousSnapshot),
    risks: buildRisks(kpis, trends, domainScores),
  };
}

/** Append Organization Health block to Morning Brief summary (UI unchanged). */
export function formatHealthScoreForBrief(health: ExecutiveHealthScore): string {
  return `Organization Health ${health.score} / 100 Grade ${health.grade} ${health.status}`;
}

export function appendHealthScoreToBrief(
  summary: string,
  health: ExecutiveHealthScore
): string {
  return `${summary} ${formatHealthScoreForBrief(health)}`;
}
