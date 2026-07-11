/**
 * Map Sprint 003 ExecutiveKPIs → FounderDashboardData for Key Metrics cards.
 * Pure adapter — no Supabase access.
 */
import {
  getVisibleFounderDashboardCards,
  type FounderDashboardCardKey,
} from "@/lib/dashboard/founder-dashboard-access";
import type {
  FounderDashboardData,
  FounderExecutiveAlert,
  FounderFinancialSummary,
} from "@/lib/dashboard/founder-dashboard";
import type { ExecutiveKPIs, ExecutiveKpiAlert } from "@/lib/executive/kpis";
import type { IdentityContext } from "@/lib/platform/identity/context";

const ALERT_HREF: Record<ExecutiveKpiAlert["type"], string | null> = {
  overdue_payroll: "/dashboard/hr",
  overdue_invoices: "/dashboard/finance",
  enrollment_below_threshold: "/dashboard/students",
  attendance_below_threshold: "/dashboard/scheduling",
  missing_staffing: "/dashboard/hr",
  failed_integrations: "/dashboard/integrations",
};

function mapAlerts(alerts: ExecutiveKpiAlert[]): FounderExecutiveAlert[] {
  return alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    body: alert.body,
    severity: alert.severity,
    href: ALERT_HREF[alert.type] ?? null,
  }));
}

export interface MapExecutiveKpisOptions {
  visibleCards?: FounderDashboardCardKey[];
  /** Preserve FI card when morning brief already loaded it (no second KPI query). */
  financialIntelligence?: FounderFinancialSummary | null;
}

/** Empty Key Metrics payload used when the KPI action fails or returns nothing. */
export function emptyFounderDashboardData(
  ctx: IdentityContext,
  visibleCards?: FounderDashboardCardKey[]
): FounderDashboardData {
  const cards = visibleCards ?? getVisibleFounderDashboardCards(ctx);
  return {
    visibleCards: cards,
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
    loadError: null,
  };
}

/**
 * Project a single ExecutiveKPIs result onto FounderDashboardCards props.
 * Only populates cards the caller is allowed to see (RBAC unchanged).
 */
export function mapExecutiveKpisToFounderDashboard(
  kpis: ExecutiveKPIs,
  ctx: IdentityContext,
  options: MapExecutiveKpisOptions = {}
): FounderDashboardData {
  const visibleCards =
    options.visibleCards ?? getVisibleFounderDashboardCards(ctx);

  const data = emptyFounderDashboardData(ctx, visibleCards);

  if (!visibleCards.length) return data;

  if (visibleCards.includes("activeEnrollment")) {
    data.activeEnrollment = kpis.enrollment;
  }
  if (visibleCards.includes("admissionsPipeline")) {
    data.admissionsPipeline = kpis.admissions;
  }
  if (visibleCards.includes("monthlyRevenue")) {
    data.monthlyRevenue = kpis.revenue;
  }
  if (visibleCards.includes("tuitionOutstanding")) {
    data.tuitionOutstanding = kpis.outstanding;
  }
  if (visibleCards.includes("staffCount")) {
    data.staffCount = kpis.staff;
  }
  if (visibleCards.includes("teacherAttendance")) {
    data.teacherAttendance = {
      rate: kpis.teacherAttendance,
      submitted: kpis.teacherAttendanceDetail.submitted,
      total: kpis.teacherAttendanceDetail.total,
    };
  }
  if (visibleCards.includes("studentAttendance")) {
    data.studentAttendance = {
      rate: kpis.studentAttendance,
      present: kpis.studentAttendanceDetail.present,
      total: kpis.studentAttendanceDetail.total,
    };
  }
  if (visibleCards.includes("upcomingClasses")) {
    data.upcomingClasses = kpis.upcomingClasses.map((session) => ({
      id: session.id,
      courseName: session.courseName,
      sectionCode: session.sectionCode,
      scheduledStart: session.scheduledStart,
      deliveryMode: session.deliveryMode,
    }));
  }
  if (visibleCards.includes("executiveAlerts")) {
    data.executiveAlerts = mapAlerts(kpis.alerts);
  }
  if (visibleCards.includes("financialIntelligence")) {
    data.financialIntelligence = options.financialIntelligence ?? null;
  }

  return data;
}
