/**
 * Founder Key Metrics types + loader.
 * Sprint 003: live values from getExecutiveKPIsAction() — single call, no UI Supabase.
 */
import {
  getVisibleFounderDashboardCards,
  type FounderDashboardCardKey,
} from "@/lib/dashboard/founder-dashboard-access";
import {
  emptyFounderDashboardData,
  mapExecutiveKpisToFounderDashboard,
} from "@/lib/dashboard/map-executive-kpis";
import { getExecutiveKPIsAction } from "@/lib/executive/actions";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { loadExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence";
import { mapWorkspaceToFounderDashboard } from "@/lib/platform/executive-intelligence/map-founder-dashboard";
import type { ExecutiveKPIs } from "@/lib/executive/kpis";

export type { FounderDashboardCardKey };

export interface FounderUpcomingClass {
  id: string;
  courseName: string;
  sectionCode: string;
  scheduledStart: string;
  deliveryMode: string | null;
}

export interface FounderExecutiveAlert {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  href: string | null;
}

export interface FounderFinancialSummary {
  operatingMargin: number | null;
  collectionRate: number | null;
  financialRisks: number;
  ebitda: number | null;
  cashPosition: number | null;
  forecastRevenue: number | null;
}

export interface FounderDashboardData {
  visibleCards: FounderDashboardCardKey[];
  activeEnrollment: number | null;
  admissionsPipeline: number | null;
  monthlyRevenue: number | null;
  tuitionOutstanding: number | null;
  staffCount: number | null;
  teacherAttendance: { rate: number | null; submitted: number; total: number } | null;
  studentAttendance: { rate: number | null; present: number; total: number } | null;
  upcomingClasses: FounderUpcomingClass[];
  executiveAlerts: FounderExecutiveAlert[];
  financialIntelligence: FounderFinancialSummary | null;
  /** Set when KPI load fails — UI shows a graceful message. */
  loadError?: string | null;
}

export interface GetFounderDashboardDataOptions {
  /**
   * @deprecated Alerts come from Executive KPIs. Kept for call-site compatibility.
   */
  skipExecutiveAlerts?: boolean;
  /**
   * When provided, only financialIntelligence is read from the workspace
   * (KPI numbers still come from getExecutiveKPIsAction / preloadedKpis).
   */
  preloadedWorkspace?: Awaited<
    ReturnType<typeof loadExecutiveIntelligenceWorkspace>
  >;
  /**
   * Reuse an already-fetched KPI action result (avoids a second getExecutiveKPIsAction call).
   */
  preloadedKpis?: Awaited<ReturnType<typeof getExecutiveKPIsAction>>;
}

const ZERO_KPIS: ExecutiveKPIs = {
  enrollment: 0,
  admissions: 0,
  admissionsByStage: [],
  revenue: 0,
  outstanding: 0,
  staff: 0,
  teacherAttendance: 0,
  teacherAttendanceDetail: {
    submittedPct: 0,
    missingPct: 0,
    submitted: 0,
    total: 0,
  },
  studentAttendance: 0,
  studentAttendanceDetail: {
    rate: 0,
    absentCount: 0,
    unsubmittedClassrooms: 0,
    present: 0,
    total: 0,
  },
  upcomingClasses: [],
  alerts: [],
};

/**
 * Founder Key Metrics — one getExecutiveKPIsAction() call, mapped to card props.
 */
export async function getFounderDashboardData(
  ctx: IdentityContext,
  options: GetFounderDashboardDataOptions = {}
): Promise<FounderDashboardData> {
  const visibleCards = getVisibleFounderDashboardCards(ctx);
  if (!visibleCards.length) {
    return emptyFounderDashboardData(ctx, visibleCards);
  }

  const kpisResult = options.preloadedKpis ?? (await getExecutiveKPIsAction());

  let financialIntelligence: FounderFinancialSummary | null = null;
  if (
    visibleCards.includes("financialIntelligence") &&
    options.preloadedWorkspace
  ) {
    financialIntelligence =
      mapWorkspaceToFounderDashboard(options.preloadedWorkspace, ctx, {
        visibleCards: ["financialIntelligence"],
      }).financialIntelligence;
  }

  if ("error" in kpisResult) {
    return {
      ...mapExecutiveKpisToFounderDashboard(ZERO_KPIS, ctx, {
        visibleCards,
        financialIntelligence,
      }),
      loadError: "Unable to load key metrics. Please try again.",
    };
  }

  return {
    ...mapExecutiveKpisToFounderDashboard(kpisResult.data, ctx, {
      visibleCards,
      financialIntelligence,
    }),
    loadError: null,
  };
}
