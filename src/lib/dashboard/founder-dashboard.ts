/**
 * Founder Key Metrics types + loader.
 * Milestone 1 Phase A: data comes from Executive Intelligence workspace
 * (aggregate + alert orchestrator + founder ops slices) — no parallel SQL.
 */
import {
  getVisibleFounderDashboardCards,
  type FounderDashboardCardKey,
} from "@/lib/dashboard/founder-dashboard-access";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadExecutiveIntelligenceWorkspace } from "@/lib/platform/executive-intelligence";
import { mapWorkspaceToFounderDashboard } from "@/lib/platform/executive-intelligence/map-founder-dashboard";

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
}

export interface GetFounderDashboardDataOptions {
  /**
   * @deprecated Alerts always come from Executive Alert Orchestrator.
   * Kept for call-site compatibility; ignored.
   */
  skipExecutiveAlerts?: boolean;
  /** When provided, maps from this workspace (no second fan-out). */
  preloadedWorkspace?: Awaited<
    ReturnType<typeof loadExecutiveIntelligenceWorkspace>
  >;
}

/**
 * Founder Key Metrics — platform services only.
 * Prefer passing preloadedWorkspace from getFounderMorningBrief.
 */
export async function getFounderDashboardData(
  ctx: IdentityContext,
  options: GetFounderDashboardDataOptions = {}
): Promise<FounderDashboardData> {
  const visibleCards = getVisibleFounderDashboardCards(ctx);
  if (!visibleCards.length) {
    return {
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
  }

  if (options.preloadedWorkspace) {
    return mapWorkspaceToFounderDashboard(options.preloadedWorkspace, ctx, {
      visibleCards,
    });
  }

  const supabase = await createAuthClient();
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ??
    ctx.accessibleSchoolIds[0];

  const workspace = await loadExecutiveIntelligenceWorkspace(supabase, ctx, {
    schoolId,
    includeJagWork: false,
    alertLimit: 25,
    decisionLimit: 5,
  });

  return mapWorkspaceToFounderDashboard(workspace, ctx, { visibleCards });
}
