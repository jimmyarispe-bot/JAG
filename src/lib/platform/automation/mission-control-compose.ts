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
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import { getLatestScorecard } from "@/lib/edi/scorecard";
import { getLatestBriefings } from "@/lib/edi/briefings";
import { getNetworkDashboardBySchool } from "@/lib/executive/network-dashboard";
import { resolveExecutiveJagWork } from "@/lib/platform/jag-work/resolve-executive-work";
import type { CommandCenterMetrics } from "@/lib/executive/types";
import type { NetworkDimensionRow } from "@/lib/executive/types";
import type { OperationalLoopSummary } from "@/lib/platform/operational-loop/types";
import type { LoopGapReport } from "@/lib/platform/operational-loop/types";
import { LOOP_TRANSITION_REGISTRY } from "@/lib/platform/operational-loop/registry";
import { OPERATIONAL_LOOP_STAGES } from "@/lib/platform/operational-loop/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface MissionControlPriorityItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  href: string | null;
  source: "mission_control" | "jag_work" | "insight";
  module?: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt?: string;
}

export interface MissionControlOeiDimension {
  key: string;
  label: string;
  score: number;
}

export interface MissionControlHealth {
  operationalHealthScore: number;
  operationalExcellenceIndex: number;
  oeiDimensions: MissionControlOeiDimension[];
  activeAlerts: number;
  studentsRequiringAttention: number;
  familiesRequiringAttention: number;
  teacherIssues: number;
  staffingIssues: number;
  schedulingIssues: number;
  admissionsPipeline: number;
  financialStatus: "healthy" | "warning" | "critical";
  loopHealthPct: number;
}

export interface MissionControlAiBrief {
  executiveBrief: string | null;
  highestRisks: Array<{ id: string; title: string; body: string; href: string | null }>;
  opportunities: Array<{ id: string; title: string; body: string; href: string | null }>;
  recommendedActions: Array<{ id: string; title: string; action: string; href: string | null }>;
  projectedProblems: Array<{ horizon: "7d" | "30d" | "90d"; items: string[] }>;
}

export interface MissionControlCommandCenter {
  feed: Awaited<ReturnType<typeof getMissionControlFeed>>;
  queueMetrics: Record<string, number>;
  marketplaceCount: number;
  summary: {
    pendingTasks: number;
    overdueTasks: number;
    failedAutomations: number;
    openItems: number;
  };
  userRole: string | null;
  accessDenied: boolean;
  schoolId: string | null;
  health: MissionControlHealth;
  priorities: Record<"critical" | "high" | "medium" | "low", MissionControlPriorityItem[]>;
  activityStream: MissionControlActivityEvent[];
  metrics: CommandCenterMetrics;
  loopSummary: OperationalLoopSummary;
  loopGapReports: LoopGapReport[];
  loopStages: Array<{ stage: string; label: string; count: number }>;
  networkMap: NetworkDimensionRow[];
  aiBrief: MissionControlAiBrief;
}

export interface MissionControlActivityEvent extends PlatformActivityEvent {
  href?: string | null;
}

function mapMcSeverity(severity: string): "critical" | "high" | "medium" | "low" {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

function buildPriorities(
  feed: Awaited<ReturnType<typeof getMissionControlFeed>>,
  jagWorkItems: ReturnType<typeof resolveExecutiveJagWork>["allItems"]
): MissionControlCommandCenter["priorities"] {
  const buckets: MissionControlCommandCenter["priorities"] = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const item of feed) {
    const severity = mapMcSeverity(item.severity ?? "normal");
    buckets[severity].push({
      id: item.id,
      title: item.title,
      description: item.body ?? "",
      severity,
      href: item.href,
      source: "mission_control",
      module: item.module,
      entityType: item.entity_type,
      entityId: item.entity_id,
      createdAt: item.created_at,
    });
  }

  for (const work of jagWorkItems) {
    const severity =
      work.priority === "critical"
        ? "critical"
        : work.priority === "high"
          ? "high"
          : work.priority === "low"
            ? "low"
            : "medium";
    buckets[severity].push({
      id: work.id,
      title: work.title,
      description: work.description ?? "",
      severity,
      href: work.href ?? null,
      source: "jag_work",
      entityType: work.entityType ?? null,
      entityId: work.entityId ?? null,
    });
  }

  for (const key of Object.keys(buckets) as Array<keyof typeof buckets>) {
    buckets[key].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  return buckets;
}

function countAttention(feed: Awaited<ReturnType<typeof getMissionControlFeed>>) {
  let students = 0;
  let families = 0;
  let teachers = 0;
  let staffing = 0;
  let scheduling = 0;

  for (const item of feed) {
    if (
      item.module === "sis" ||
      item.item_type === "escalation" ||
      item.entity_type === "students" ||
      item.entity_type === "student"
    ) {
      students += 1;
    }
    if (item.module === "parent_portal" || item.entity_type === "families") families += 1;
    if (
      item.module === "teacher_portal" ||
      item.item_type === "teacher_compliance_alert"
    ) {
      teachers += 1;
    }
    if (item.module === "hr" || item.item_type === "hr_alert") staffing += 1;
    if (item.module === "scheduling" || item.item_type === "scheduling_alert") scheduling += 1;
  }

  return { students, families, teachers, staffing, scheduling };
}

function buildOei(scorecard: Awaited<ReturnType<typeof getLatestScorecard>>): {
  index: number;
  dimensions: MissionControlOeiDimension[];
} {
  const dimensions: MissionControlOeiDimension[] = [
    { key: "learning", label: "Learning", score: scorecard.studentSuccess },
    { key: "operations", label: "Operations", score: scorecard.operationalEfficiency },
    { key: "finance", label: "Finance", score: scorecard.financialHealth },
    { key: "people", label: "People", score: Math.round((scorecard.teacherEffectiveness + scorecard.capacity) / 2) },
    { key: "family", label: "Family Experience", score: scorecard.parentEngagement },
    { key: "compliance", label: "Compliance", score: scorecard.compliance },
    { key: "growth", label: "Growth", score: scorecard.growth },
  ];
  const index = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  return { index, dimensions };
}

function buildActivityHref(event: PlatformActivityEvent): string | null {
  if (event.entity_type === "students" || event.student_id) {
    return `/dashboard/students/${event.student_id ?? event.entity_id}`;
  }
  if (event.entity_type === "admissions_leads" || event.entity_type === "admissions_lead") {
    return `/dashboard/admissions/leads/${event.entity_id}`;
  }
  if (event.entity_type === "instructional_sessions") {
    return `/dashboard/teacher/sessions/${event.entity_id}`;
  }
  if (event.entity_type === "families") {
    return `/dashboard/families/${event.entity_id}`;
  }
  if (event.entity_type === "employees") {
    return `/dashboard/hr/employees/${event.entity_id}`;
  }
  return null;
}

function buildAiBrief(
  insights: Awaited<ReturnType<typeof getExecutiveInsights>>,
  briefings: Awaited<ReturnType<typeof getLatestBriefings>>,
  loopSummary: OperationalLoopSummary
): MissionControlAiBrief {
  const riskBrief = briefings.find((b) => b.briefing_type === "risks");
  const oppBrief = briefings.find((b) => b.briefing_type === "opportunities");

  const highestRisks = insights
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 5)
    .map((i) => ({ id: i.id, title: i.title, body: i.body, href: i.href }));

  const opportunities = insights
    .filter((i) => i.insight_type === "opportunity" || i.insight_type === "growth")
    .slice(0, 5)
    .map((i) => ({ id: i.id, title: i.title, body: i.body, href: i.href }));

  const recommendedActions = insights
    .filter((i) => i.recommended_action)
    .slice(0, 6)
    .map((i) => ({
      id: i.id,
      title: i.title,
      action: i.recommended_action!,
      href: i.href,
    }));

  const projectedProblems: MissionControlAiBrief["projectedProblems"] = [
    {
      horizon: "7d",
      items: [
        ...(loopSummary.failedTransitions24h > 0
          ? [`${loopSummary.failedTransitions24h} operational loop transition failure(s) in 24h`]
          : []),
        ...(loopSummary.openGaps > 0
          ? [`${loopSummary.openGaps} student handoff gap(s) across active enrollments`]
          : []),
        ...highestRisks.slice(0, 2).map((r) => r.title),
      ],
    },
    {
      horizon: "30d",
      items: opportunities.slice(0, 3).map((o) => o.title),
    },
    {
      horizon: "90d",
      items: recommendedActions.slice(0, 3).map((a) => a.title),
    },
  ];

  return {
    executiveBrief:
      (riskBrief?.summary as string | null) ??
      (highestRisks[0] ? `${highestRisks[0].title}: ${highestRisks[0].body}` : null) ??
      (oppBrief?.summary as string | null) ??
      null,
    highestRisks,
    opportunities,
    recommendedActions,
    projectedProblems,
  };
}

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

  // Prefer orchestrated alerts for AI brief + JAG Work; fall back to legacy insights.
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
