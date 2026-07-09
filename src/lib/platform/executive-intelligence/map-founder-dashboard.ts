/**
 * Map Executive Intelligence workspace → FounderDashboardData.
 * Pure data-layer adapter — preserves FounderDashboardCards props (no UI change).
 */
import {
  getVisibleFounderDashboardCards,
  type FounderDashboardCardKey,
} from "@/lib/dashboard/founder-dashboard-access";
import type {
  FounderDashboardData,
  FounderExecutiveAlert,
  FounderFinancialSummary,
  FounderUpcomingClass,
} from "@/lib/dashboard/founder-dashboard";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { ExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence/workspace";
import { alertsToFounderCards } from "@/lib/platform/executive-intelligence/workspace";
import type { ExecutiveAggregateMetrics } from "@/lib/platform/executive-metrics";
import type { FounderOperationalSlice } from "@/lib/platform/executive-metrics/founder-ops";

function metricValue(
  aggregate: ExecutiveAggregateMetrics | null,
  id: string
): number | null {
  const v = aggregate?.byId[id]?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function mapFinancialIntelligence(
  aggregate: ExecutiveAggregateMetrics | null,
  fi: {
    operatingMargin?: number | null;
    revenueTrend?: number | null;
    financialRisks?: number;
    ebitda?: number | null;
    cashPosition?: number | null;
    forecastRevenue?: number | null;
  } | null
): FounderFinancialSummary | null {
  if (!fi && !aggregate) return null;

  return {
    operatingMargin:
      fi?.operatingMargin ?? metricValue(aggregate, "finance.operating_margin"),
    collectionRate:
      fi?.revenueTrend ?? metricValue(aggregate, "finance.collection_rate"),
    financialRisks:
      fi?.financialRisks ??
      metricValue(aggregate, "finance.open_financial_risks") ??
      0,
    ebitda: fi?.ebitda ?? metricValue(aggregate, "finance.ebitda"),
    cashPosition: fi?.cashPosition ?? metricValue(aggregate, "finance.cash_position"),
    forecastRevenue: fi?.forecastRevenue ?? null,
  };
}

function mapTeacherAttendance(ops: FounderOperationalSlice | null | undefined) {
  if (!ops?.teacherAttendance) return null;
  return ops.teacherAttendance;
}

function mapStudentAttendance(
  ops: FounderOperationalSlice | null | undefined,
  aggregate: ExecutiveAggregateMetrics | null
) {
  if (ops?.studentAttendance) return ops.studentAttendance;
  const rate = metricValue(aggregate, "attendance.rate");
  if (rate == null) return null;
  return {
    rate,
    present: metricValue(aggregate, "attendance.student_present_today") ?? 0,
    total: metricValue(aggregate, "attendance.student_records_today") ?? 0,
  };
}

function mapUpcomingClasses(
  ops: FounderOperationalSlice | null | undefined
): FounderUpcomingClass[] {
  return (ops?.upcomingClasses ?? []).map((c) => ({
    id: c.id,
    courseName: c.courseName,
    sectionCode: c.sectionCode,
    scheduledStart: c.scheduledStart,
    deliveryMode: c.deliveryMode,
  }));
}

export interface MapWorkspaceToFounderDashboardOptions {
  /** Override visible cards (defaults to RBAC for identity). */
  visibleCards?: FounderDashboardCardKey[];
  /** Pre-mapped alerts; defaults to workspace.alerts via alertsToFounderCards. */
  executiveAlerts?: FounderExecutiveAlert[];
}

/**
 * Derive Founder Key Metrics from a single workspace load.
 * No additional SQL — uses aggregate + founderOps from metrics fan-out.
 */
export function mapWorkspaceToFounderDashboard(
  workspace: ExecutiveIntelligenceWorkspace,
  identity: IdentityContext,
  options: MapWorkspaceToFounderDashboardOptions = {}
): FounderDashboardData {
  const visibleCards =
    options.visibleCards ?? getVisibleFounderDashboardCards(identity);
  const aggregate = workspace.aggregate;
  const ops = workspace.alertSources.metricsSources?.founderOps ?? null;
  const fi = workspace.alertSources.metricsSources?.financialIntelligence ?? null;

  const empty: FounderDashboardData = {
    visibleCards,
    activeEnrollment: null,
    admissionsPipeline: null,
    monthlyRevenue: null,
    tuitionOutstanding: null,
    staffCount: null,
    teacherAttendance: null,
    studentAttendance: null,
    upcomingClasses: [],
    executiveAlerts: [],
    financialIntelligence: null,
  };

  if (!visibleCards.length) return empty;

  if (visibleCards.includes("activeEnrollment")) {
    empty.activeEnrollment = metricValue(aggregate, "enrollment.active_enrollments");
  }
  if (visibleCards.includes("admissionsPipeline")) {
    empty.admissionsPipeline = metricValue(aggregate, "admissions.pipeline_active");
  }
  if (visibleCards.includes("monthlyRevenue")) {
    empty.monthlyRevenue =
      metricValue(aggregate, "finance.monthly_revenue") ?? ops?.monthlyRevenue ?? null;
  }
  if (visibleCards.includes("tuitionOutstanding")) {
    empty.tuitionOutstanding = metricValue(aggregate, "finance.accounts_receivable");
  }
  if (visibleCards.includes("staffCount")) {
    empty.staffCount = metricValue(aggregate, "staffing.headcount_active");
  }
  if (visibleCards.includes("teacherAttendance")) {
    empty.teacherAttendance = mapTeacherAttendance(ops);
  }
  if (visibleCards.includes("studentAttendance")) {
    empty.studentAttendance = mapStudentAttendance(ops, aggregate);
  }
  if (visibleCards.includes("upcomingClasses")) {
    empty.upcomingClasses = mapUpcomingClasses(ops);
  }
  if (visibleCards.includes("executiveAlerts")) {
    empty.executiveAlerts =
      options.executiveAlerts ?? alertsToFounderCards(workspace.alerts.alerts, 5);
  }
  if (visibleCards.includes("financialIntelligence")) {
    empty.financialIntelligence = mapFinancialIntelligence(aggregate, fi);
  }

  return empty;
}
