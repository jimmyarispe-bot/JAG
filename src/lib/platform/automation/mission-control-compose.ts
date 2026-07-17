/**
 * Mission Control command-center composer (orchestrator).
 *
 * Phase B / H-A12: types and facet helpers live in sibling modules;
 * this file retains the public compose entrypoint and re-exports.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { resolvePrimarySchoolId } from "@/lib/platform/identity/school-access";
import { getMissionControlFeed } from "@/lib/platform/automation/mission-control";
import { getPlatformQueueMetrics } from "@/lib/platform/automation/queue";
import { getMarketplaceTemplates } from "@/lib/platform/automation/marketplace";
import { getMissionControlModulesForUser } from "@/lib/platform/identity/permissions";
import { getExecutiveInsights } from "@/lib/executive/command-center";
import { getExecutiveAggregateMetrics } from "@/lib/platform/executive-metrics";
import { aggregateToCommandCenterMetrics } from "@/lib/platform/executive-metrics/adapters/command-center";
import { getExecutiveAlerts } from "@/lib/platform/executive-alerts";
import { getOperationalLoopSummary } from "@/lib/platform/operational-loop/queries";
import { generateSchoolLoopGapReport } from "@/lib/platform/operational-loop/diagnostics";
import { getActivityFeed } from "@/lib/platform/activity/query";
import { getLatestScorecard } from "@/lib/edi/scorecard";
import { getLatestBriefings } from "@/lib/edi/briefings";
import { getNetworkDashboardBySchool } from "@/lib/executive/network-dashboard";
import { resolveExecutiveJagWork } from "@/lib/platform/jag-work/resolve-executive-work";
import type { OperationalLoopSummary } from "@/lib/platform/operational-loop/types";
import { LOOP_TRANSITION_REGISTRY } from "@/lib/platform/operational-loop/registry";
import { OPERATIONAL_LOOP_STAGES } from "@/lib/platform/operational-loop/types";
import type {
  MissionControlCommandCenter,
  MissionControlHealth,
} from "@/lib/platform/automation/mission-control-types";
import {
  buildActivityHref,
  buildAiBrief,
  buildOei,
  buildPriorities,
  countAttention,
} from "@/lib/platform/automation/mission-control-facets";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type {
  MissionControlPriorityItem,
  MissionControlOeiDimension,
  MissionControlHealth,
  MissionControlAiBrief,
  MissionControlCommandCenter,
  MissionControlActivityEvent,
} from "@/lib/platform/automation/mission-control-types";

/** Compose Mission Control command center from existing JAG runtime services only. */
export async function composeMissionControlCommandCenter(
  supabase: AuthClient,
  ctx: IdentityContext | null
): Promise<MissionControlCommandCenter> {
  const empty: MissionControlCommandCenter = {
    feed: [],
    queueMetrics: {},
    marketplaceCount: 0,
    summary: { pendingTasks: 0, overdueTasks: 0, failedAutomations: 0, openItems: 0 },
    userRole: null,
    accessDenied: true,
    schoolId: null,
    health: {
      operationalHealthScore: 0,
      operationalExcellenceIndex: 0,
      oeiDimensions: [],
      activeAlerts: 0,
      studentsRequiringAttention: 0,
      familiesRequiringAttention: 0,
      teacherIssues: 0,
      staffingIssues: 0,
      schedulingIssues: 0,
      admissionsPipeline: 0,
      financialStatus: "healthy",
      loopHealthPct: 100,
    },
    priorities: { critical: [], high: [], medium: [], low: [] },
    activityStream: [],
    metrics: {
      enrollment: 0,
      enrollmentTrendPct: null,
      admissionsPipeline: 0,
      revenue: 0,
      cashFlow: 0,
      accountsReceivable: 0,
      scholarships: 0,
      stateFunding: 0,
      avgSuccessScore: null,
      attendanceRate: null,
      academicGrowthPct: null,
      interventionEffectiveness: null,
      staffingLevels: 0,
      payrollYtd: 0,
      complianceAlerts: 0,
      missionControlOpen: 0,
      missionControlCritical: 0,
    },
    loopSummary: {
      activeStudents: 0,
      byStage: Object.fromEntries(OPERATIONAL_LOOP_STAGES.map((s) => [s, 0])) as OperationalLoopSummary["byStage"],
      failedTransitions24h: 0,
      completedTransitions24h: 0,
      openGaps: 0,
      recentTransitions: [],
    },
    loopGapReports: [],
    loopStages: OPERATIONAL_LOOP_STAGES.map((stage) => ({
      stage,
      label: stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count: 0,
    })),
    networkMap: [],
    aiBrief: {
      executiveBrief: null,
      highestRisks: [],
      opportunities: [],
      recommendedActions: [],
      projectedProblems: [],
    },
  };

  if (!ctx) return empty;

  const canAccess =
    hasPermission(ctx, "mission_control.access") ||
    hasPermission(ctx, "executive.dashboard") ||
    hasPermission(ctx, "JAG_ACCESS");

  if (!canAccess) {
    return { ...empty, userRole: ctx.primaryRole, accessDenied: true };
  }

  const schoolId =
    resolvePrimarySchoolId(ctx, undefined) ?? ctx.orgAssignments[0]?.school_id ?? null;
  const allowedModules = await getMissionControlModulesForUser(supabase, ctx.effectiveUserId);
  const role = ctx.primaryRole ?? null;
  const schoolFilter = ctx.hasUnrestrictedSchoolAccess ? undefined : ctx.accessibleSchoolIds;

  const [feed, queueMetrics, marketplace, aggregate, loopSummary, activityStream, networkMap, alertStream] =
    await Promise.all([
      getMissionControlFeed(supabase, {
        assignedRole: allowedModules === null ? undefined : role ?? undefined,
        allowedModules: allowedModules ?? undefined,
        accessibleSchoolIds: schoolFilter,
        limit: 50,
      }),
      getPlatformQueueMetrics(supabase),
      getMarketplaceTemplates(),
      getExecutiveAggregateMetrics(supabase, {
        schoolId: schoolId ?? null,
      }).catch(() => null),
      getOperationalLoopSummary(supabase, schoolId ?? undefined),
      getActivityFeed(supabase, {
        organizationId: undefined,
        classification: ["operational", "communication", "audit"],
        limit: 40,
      }),
      getNetworkDashboardBySchool(supabase),
      getExecutiveAlerts(supabase, {
        filters: { schoolId: schoolId ?? null },
        limit: 20,
      }).catch(() => null),
    ]);

  const metrics = aggregateToCommandCenterMetrics(aggregate, {
    missionControlOpen: feed.length,
    missionControlCritical: feed.filter((f) => f.severity === "critical").length,
  });

  const loopGapReports = schoolId
    ? await generateSchoolLoopGapReport(supabase, schoolId, 25)
    : [];

  const scorecard = schoolId
    ? await getLatestScorecard(supabase, schoolId)
    : {
        financialHealth: 70,
        enrollmentHealth: 70,
        studentSuccess: 70,
        teacherEffectiveness: 70,
        compliance: 70,
        growth: 70,
        parentEngagement: 70,
        operationalEfficiency: 70,
        capacity: 70,
        risk: 70,
        overallEnterpriseHealth: 70,
      };

  const legacyInsights = schoolId
    ? await getExecutiveInsights(supabase, schoolId, 20)
    : [];
  const briefings = schoolId ? await getLatestBriefings(supabase, schoolId, 5) : [];

  const insightsForBrief =
    alertStream && alertStream.alerts.length > 0
      ? alertStream.alerts.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.description,
          severity: a.severity.toLowerCase(),
          insight_type: a.category.toLowerCase(),
          recommended_action: a.recommendedAction,
          href: a.missionControlReference
            ? "/dashboard/mission-control"
            : "/dashboard/executive",
          metric_key: a.signalKey,
          metric_value: null as number | null,
        }))
      : legacyInsights;

  const jagWork = resolveExecutiveJagWork({
    supabase,
    identity: ctx,
    activePerspective: "highest_priorities",
    insights: insightsForBrief.map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      category: i.insight_type,
      recommended_action: i.recommended_action,
    })),
    complianceAlerts: metrics.complianceAlerts,
    missionControlCritical: feed.filter((f) => f.severity === "critical").length,
    engineRecommendations: [],
    executionState: null,
  });

  const pendingTasks = feed.filter((f) => f.item_type === "pending_task").length;
  const overdueTasks = feed.filter((f) => f.item_type === "overdue_task").length;
  const failedAutomations = feed.filter((f) => f.item_type === "failed_automation").length;
  const attention = countAttention(feed);
  const oei = buildOei(scorecard);

  const loopTotal =
    loopSummary.completedTransitions24h +
    loopSummary.failedTransitions24h +
    Math.min(loopSummary.openGaps, 50);
  const loopHealthPct =
    loopTotal > 0
      ? Math.round((loopSummary.completedTransitions24h / loopTotal) * 100)
      : 100;

  let financialStatus: MissionControlHealth["financialStatus"] = "healthy";
  if (metrics.accountsReceivable > metrics.revenue * 0.3 || metrics.complianceAlerts > 5) {
    financialStatus = "critical";
  } else if (metrics.accountsReceivable > metrics.revenue * 0.15 || metrics.complianceAlerts > 0) {
    financialStatus = "warning";
  }

  const activityWithLinks = activityStream.map((event) => ({
    ...event,
    href: buildActivityHref(event),
  }));

  return {
    feed,
    queueMetrics,
    marketplaceCount: marketplace.length,
    summary: {
      pendingTasks,
      overdueTasks,
      failedAutomations,
      openItems: feed.length,
    },
    userRole: role,
    accessDenied: false,
    schoolId,
    health: {
      operationalHealthScore: scorecard.overallEnterpriseHealth,
      operationalExcellenceIndex: oei.index,
      oeiDimensions: oei.dimensions,
      activeAlerts: feed.length,
      studentsRequiringAttention: attention.students + loopGapReports.length,
      familiesRequiringAttention: attention.families,
      teacherIssues: attention.teachers,
      staffingIssues: attention.staffing,
      schedulingIssues: attention.scheduling,
      admissionsPipeline: metrics.admissionsPipeline,
      financialStatus,
      loopHealthPct,
    },
    priorities: buildPriorities(feed, jagWork.allItems),
    activityStream: activityWithLinks,
    metrics,
    loopSummary,
    loopGapReports,
    loopStages: OPERATIONAL_LOOP_STAGES.map((stage) => ({
      stage,
      label: stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count: loopSummary.byStage[stage] ?? 0,
    })),
    networkMap: networkMap.slice(0, 12),
    aiBrief: buildAiBrief(insightsForBrief, briefings, loopSummary),
  };
}

export { LOOP_TRANSITION_REGISTRY, buildActivityHref };
