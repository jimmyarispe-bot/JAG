/**
 * Executive Intelligence Graph — deterministic causal rules.
 * Each rule returns ruleId, reason, confidence, supportingEvidence.
 */

import type { ExecutiveKPIs } from "@/lib/executive/kpis";
import type { ExecutiveTrends, ExecutiveMetricTrend } from "@/lib/executive/trends";
import type { ExecutiveHealthScore } from "@/lib/executive/health-score";
import type {
  ExecutiveGraphConfidence,
  ExecutiveGraphEvidence,
  ExecutiveGraphRuleResult,
} from "@/lib/platform/executive-graph/types";

export interface ExecutiveGraphRuleContext {
  kpis: ExecutiveKPIs;
  trends: ExecutiveTrends;
  health: ExecutiveHealthScore;
  builtAt: string;
}

function trend(
  ctx: ExecutiveGraphRuleContext,
  metric: ExecutiveMetricTrend["metric"]
): ExecutiveMetricTrend | undefined {
  return ctx.trends.metrics.find((m) => m.metric === metric);
}

function isDeclining(t: ExecutiveMetricTrend | undefined): boolean {
  return t?.status === "DECLINING";
}

function isImproving(t: ExecutiveMetricTrend | undefined): boolean {
  return t?.status === "IMPROVING";
}

function evidenceFromTrend(t: ExecutiveMetricTrend | undefined): ExecutiveGraphEvidence[] {
  if (!t) return [];
  return [
    {
      label: t.label,
      detail: t.sentence ?? `${t.status} (${t.trendDirection})`,
      sourceId: t.metric,
      sourceKind: "trend",
      value: t.deltaPercent ?? t.delta,
    },
  ];
}

function result(partial: Omit<ExecutiveGraphRuleResult, "fired"> & { fired?: boolean }): ExecutiveGraphRuleResult {
  return { fired: partial.fired ?? true, ...partial };
}

/** Admissions ↓ → contributes_to Enrollment ↓ */
export function ruleAdmissionsToEnrollment(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const admissions = trend(ctx, "admissions");
  const enrollment = trend(ctx, "enrollment");
  const fired = isDeclining(admissions);
  return result({
    ruleId: "eig.admissions_declines_enrollment",
    reason: "Admissions pipeline decline contributes to enrollment pressure.",
    confidence: fired && isDeclining(enrollment) ? "High" : fired ? "Medium" : "Low",
    supportingEvidence: [
      ...evidenceFromTrend(admissions),
      ...evidenceFromTrend(enrollment),
      { label: "Admissions count", value: ctx.kpis.admissions, sourceKind: "kpi" },
    ],
    edgeType: "CONTRIBUTES_TO",
    sourceKey: "kpi.admissions",
    targetKey: "kpi.enrollment",
    fired,
  });
}

/** Enrollment ↓ → contributes_to Revenue ↓ */
export function ruleEnrollmentToRevenue(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const enrollment = trend(ctx, "enrollment");
  const revenue = trend(ctx, "revenue");
  const fired = isDeclining(enrollment) || ctx.kpis.enrollment === 0;
  return result({
    ruleId: "eig.enrollment_declines_revenue",
    reason: "Enrollment decline contributes to revenue decline.",
    confidence: fired && isDeclining(revenue) ? "High" : fired ? "Medium" : "Low",
    supportingEvidence: [
      ...evidenceFromTrend(enrollment),
      ...evidenceFromTrend(revenue),
      { label: "Enrollment", value: ctx.kpis.enrollment, sourceKind: "kpi" },
      { label: "Revenue", value: ctx.kpis.revenue, sourceKind: "kpi" },
    ],
    edgeType: "CONTRIBUTES_TO",
    sourceKey: "kpi.enrollment",
    targetKey: "financial.revenue",
    fired,
  });
}

/** Revenue ↓ → contributes_to Cash ↓ */
export function ruleRevenueToCash(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const revenue = trend(ctx, "revenue");
  const fired = isDeclining(revenue) || ctx.kpis.revenue === 0;
  return result({
    ruleId: "eig.revenue_declines_cash",
    reason: "Revenue decline contributes to cash position pressure.",
    confidence: fired ? "High" : "Low",
    supportingEvidence: [
      ...evidenceFromTrend(revenue),
      { label: "Monthly revenue", value: ctx.kpis.revenue, sourceKind: "kpi" },
    ],
    edgeType: "CONTRIBUTES_TO",
    sourceKey: "financial.revenue",
    targetKey: "financial.cash",
    fired,
  });
}

/** Cash ↓ → contributes_to Tax Liability Risk */
export function ruleCashToTaxRisk(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const revenue = trend(ctx, "revenue");
  const outstanding = trend(ctx, "outstanding");
  const cashPressure =
    isDeclining(revenue) ||
    ctx.kpis.revenue === 0 ||
    isDeclining(outstanding);

  return result({
    ruleId: "eig.cash_to_tax_liability_risk",
    reason: "Cash pressure contributes to tax liability risk.",
    confidence: cashPressure ? "Medium" : "Low",
    supportingEvidence: [
      ...evidenceFromTrend(revenue),
      ...evidenceFromTrend(outstanding),
    ],
    edgeType: "CONTRIBUTES_TO",
    sourceKey: "financial.cash",
    targetKey: "tax.liability_risk",
    fired: cashPressure,
  });
}

/** Collections ↓ (outstanding ↑ / DECLINING) → contributes_to Cash */
export function ruleCollectionsToCash(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const outstanding = trend(ctx, "outstanding");
  const fired =
    isDeclining(outstanding) || (ctx.kpis.outstanding > 0 && ctx.kpis.revenue === 0);
  return result({
    ruleId: "eig.collections_to_cash",
    reason: "Slowing collections contribute to cash pressure.",
    confidence: isDeclining(outstanding) ? "High" : fired ? "Medium" : "Low",
    supportingEvidence: [
      ...evidenceFromTrend(outstanding),
      { label: "Outstanding tuition", value: ctx.kpis.outstanding, sourceKind: "kpi" },
    ],
    edgeType: "CONTRIBUTES_TO",
    sourceKey: "financial.collections",
    targetKey: "financial.cash",
    fired,
  });
}

/** Payroll overdue → contributes_to Compliance Risk */
export function rulePayrollToCompliance(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const payroll = ctx.kpis.alerts.find((a) => a.type === "overdue_payroll");
  const fired = Boolean(payroll);
  return result({
    ruleId: "eig.payroll_overdue_compliance",
    reason: "Overdue payroll contributes to compliance risk.",
    confidence: fired ? "High" : "Low",
    supportingEvidence: payroll
      ? [
          {
            label: payroll.title,
            detail: payroll.body,
            sourceId: payroll.id,
            sourceKind: "kpi_alert",
            value: payroll.count,
          },
        ]
      : [],
    edgeType: "CONTRIBUTES_TO",
    sourceKey: "alert.overdue_payroll",
    targetKey: "compliance.risk",
    fired,
  });
}

/** Attendance ↓ → contributes_to Student Success */
export function ruleAttendanceToStudentSuccess(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const student = trend(ctx, "studentAttendance");
  const teacher = trend(ctx, "teacherAttendance");
  const lowStudent =
    ctx.kpis.studentAttendanceDetail.total > 0 && ctx.kpis.studentAttendance < 90;
  const fired = isDeclining(student) || isDeclining(teacher) || lowStudent;
  return result({
    ruleId: "eig.attendance_to_student_success",
    reason: "Attendance decline contributes to student success risk.",
    confidence: fired ? "High" : "Low",
    supportingEvidence: [
      ...evidenceFromTrend(student),
      ...evidenceFromTrend(teacher),
      {
        label: "Student attendance %",
        value: ctx.kpis.studentAttendance,
        sourceKind: "kpi",
      },
    ],
    edgeType: "CONTRIBUTES_TO",
    sourceKey: "kpi.student_attendance",
    targetKey: "lifecycle.student_success",
    fired,
  });
}

/** Admissions ↑ → IMPROVES enrollment path (positive) */
export function ruleAdmissionsImprovesEnrollment(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const admissions = trend(ctx, "admissions");
  const fired = isImproving(admissions);
  return result({
    ruleId: "eig.admissions_improves_enrollment",
    reason: "Admissions growth supports enrollment.",
    confidence: fired ? "Medium" : "Low",
    supportingEvidence: evidenceFromTrend(admissions),
    edgeType: "IMPROVES",
    sourceKey: "kpi.admissions",
    targetKey: "kpi.enrollment",
    fired,
  });
}

/** Health Score ← aggregates all contributors (MEASURES / DEPENDS_ON) */
export function ruleHealthAggregatesContributors(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult[] {
  return ctx.health.contributors
    .filter((c) => c.domain !== "trendMomentum")
    .map((c) =>
      result({
        ruleId: `eig.health_measures_${c.domain}`,
        reason: `${c.label} contributes to Executive Health Score.`,
        confidence: "High" as ExecutiveGraphConfidence,
        supportingEvidence: [
          {
            label: c.label,
            detail: `score ${c.score}/100 · weight ${c.weight}%`,
            sourceId: c.domain,
            sourceKind: "health_contributor",
            value: c.weightedPoints,
          },
        ],
        edgeType: "MEASURES",
        sourceKey: `health.contributor.${c.domain}`,
        targetKey: "health.score",
        fired: true,
      })
    );
}

/** Revenue ↑ → IMPROVES cash */
export function ruleRevenueImprovesCash(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult {
  const revenue = trend(ctx, "revenue");
  const fired = isImproving(revenue) && ctx.kpis.revenue > 0;
  return result({
    ruleId: "eig.revenue_improves_cash",
    reason: "Revenue growth improves cash position.",
    confidence: fired ? "High" : "Low",
    supportingEvidence: evidenceFromTrend(revenue),
    edgeType: "IMPROVES",
    sourceKey: "financial.revenue",
    targetKey: "financial.cash",
    fired,
  });
}

/** All causal rules evaluated against context. */
export function evaluateExecutiveGraphRules(
  ctx: ExecutiveGraphRuleContext
): ExecutiveGraphRuleResult[] {
  return [
    ruleAdmissionsToEnrollment(ctx),
    ruleEnrollmentToRevenue(ctx),
    ruleRevenueToCash(ctx),
    ruleCashToTaxRisk(ctx),
    ruleCollectionsToCash(ctx),
    rulePayrollToCompliance(ctx),
    ruleAttendanceToStudentSuccess(ctx),
    ruleAdmissionsImprovesEnrollment(ctx),
    ruleRevenueImprovesCash(ctx),
    ...ruleHealthAggregatesContributors(ctx),
  ];
}
