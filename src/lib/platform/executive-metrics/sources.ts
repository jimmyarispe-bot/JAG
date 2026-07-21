/**
 * Shared source bundle for executive metrics.
 * Loads existing domain composers once; providers only map — no duplicate queries.
 *
 * Does NOT call getCommandCenterMetrics or getMissionControlDashboard
 * (those re-enter this fan-out / compose and duplicate work).
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getDashboardMetrics } from "@/lib/dashboard/metrics";
import { getExecutiveAdmissionsMetrics } from "@/lib/admissions/executive-metrics";
import { getFinanceExecutiveDashboard } from "@/lib/finance/dashboards";
import { getWorkforceAnalytics } from "@/lib/hr/analytics";
import { getMissionControlFeed } from "@/lib/platform/automation/mission-control";
import { getComplianceDashboardStats } from "@/lib/compliance/queries";
import { getSchedulingExecutiveStats } from "@/lib/scheduling/queries";
import { getOperationalLoopSummary } from "@/lib/platform/operational-loop/queries";
import { getActivityFeed } from "@/lib/platform/activity/query";
import { getExecutiveFinancialDashboard } from "@/lib/financial-intelligence/executive";
import type { ExecutiveMetricsScope } from "@/lib/platform/executive-metrics/types";
import {
  hasExtendedHierarchyFilters,
  resolveSchoolScopeId,
} from "@/lib/platform/executive-metrics/scope";
import type { CommandCenterMetrics } from "@/lib/executive/types";
import {
  loadFounderOperationalSlice,
  type FounderOperationalSlice,
} from "@/lib/platform/executive-metrics/founder-ops";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface MissionControlFeedSummary {
  openItems: number;
  overdueTasks: number;
  failedAutomations: number;
  criticalCount: number;
  feed: Awaited<ReturnType<typeof getMissionControlFeed>>;
}

export interface ExecutiveMetricsSourceBundle {
  loadedAt: string;
  scope: ExecutiveMetricsScope;
  schoolId: string | undefined;
  /** Extended filters are accepted but not fully applied by all domain loaders yet. */
  extendedFiltersPartial: boolean;
  dashboard: Awaited<ReturnType<typeof getDashboardMetrics>> | null;
  /**
   * @deprecated Prefer domain fields. Kept null — CCM removed from fan-out to
   * avoid circular CCM ↔ MC compose and duplicate domain queries.
   */
  commandCenter: CommandCenterMetrics | null;
  admissions: Awaited<ReturnType<typeof getExecutiveAdmissionsMetrics>> | null;
  finance: Awaited<ReturnType<typeof getFinanceExecutiveDashboard>> | null;
  workforce: Awaited<ReturnType<typeof getWorkforceAnalytics>> | null;
  missionControl: MissionControlFeedSummary | null;
  compliance: Awaited<ReturnType<typeof getComplianceDashboardStats>> | null;
  scheduling: Awaited<ReturnType<typeof getSchedulingExecutiveStats>> | null;
  operationalLoop: Awaited<ReturnType<typeof getOperationalLoopSummary>> | null;
  activityRecentCount: number | null;
  financialIntelligence: Awaited<ReturnType<typeof getExecutiveFinancialDashboard>> | null;
  /** Founder Key Metrics ops slices (MTD revenue, today attendance, upcoming classes). */
  founderOps: FounderOperationalSlice | null;
}

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

async function loadActivityRecentCount(
  supabase: AuthClient,
  organizationId: string | null
): Promise<number | null> {
  try {
    const events = await getActivityFeed(supabase, {
      organizationId: organizationId ?? undefined,
      limit: 50,
    });
    return events.length;
  } catch {
    return null;
  }
}

async function loadMissionControlSummary(
  supabase: AuthClient,
  schoolId: string | undefined
): Promise<MissionControlFeedSummary | null> {
  try {
    const feed = await getMissionControlFeed(supabase, {
      schoolId,
      limit: 50,
    });
    return {
      openItems: feed.length,
      overdueTasks: feed.filter((i) => i.item_type === "overdue_task").length,
      failedAutomations: feed.filter((i) => i.item_type === "failed_automation").length,
      criticalCount: feed.filter((i) => (i.severity ?? "").toLowerCase() === "critical")
        .length,
      feed,
    };
  } catch {
    return null;
  }
}

/**
 * Fan-out to existing module composers. Failures become null sources
 * so providers emit Unknown metrics instead of inventing zeros.
 */
export async function loadExecutiveMetricsSources(
  supabase: AuthClient,
  scope: ExecutiveMetricsScope
): Promise<ExecutiveMetricsSourceBundle> {
  const schoolId = resolveSchoolScopeId(scope);
  const loadedAt = new Date().toISOString();

  // P004: fold financial intelligence into the domain fan-out (was a sequential tail).
  const [
    dashboard,
    admissions,
    finance,
    workforce,
    missionControl,
    compliance,
    scheduling,
    operationalLoop,
    activityRecentCount,
    founderOps,
    financialIntelligence,
  ] = await Promise.all([
    settled(getDashboardMetrics()),
    settled(getExecutiveAdmissionsMetrics()),
    settled(getFinanceExecutiveDashboard(supabase, schoolId)),
    settled(getWorkforceAnalytics(supabase, schoolId)),
    loadMissionControlSummary(supabase, schoolId),
    settled(getComplianceDashboardStats(supabase, schoolId)),
    settled(getSchedulingExecutiveStats(schoolId)),
    settled(getOperationalLoopSummary(supabase, schoolId)),
    loadActivityRecentCount(supabase, scope.organizationId),
    settled(loadFounderOperationalSlice(supabase, schoolId)),
    schoolId
      ? settled(getExecutiveFinancialDashboard(supabase, schoolId))
      : Promise.resolve(null),
  ]);

  return {
    loadedAt,
    scope,
    schoolId,
    extendedFiltersPartial: hasExtendedHierarchyFilters(scope),
    dashboard,
    commandCenter: null,
    admissions,
    finance,
    workforce,
    missionControl,
    compliance,
    scheduling,
    operationalLoop,
    activityRecentCount,
    financialIntelligence,
    founderOps,
  };
}
