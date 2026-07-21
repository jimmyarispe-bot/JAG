/**
 * Shared Executive Intelligence workspace loader — Sprint 002 Task 6.
 * One fan-out per request; surfaces consume slices (no duplicate queries).
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { observeExecutiveIntelligence } from "@/lib/observability";
import type { IdentityContext } from "@/lib/platform/identity/context";
import {
  getExecutiveAggregateMetrics,
  type ExecutiveAggregateMetrics,
  type ExecutiveMetricsFilters,
} from "@/lib/platform/executive-metrics";
import { aggregateToCommandCenterMetrics } from "@/lib/platform/executive-metrics/adapters/command-center";
import {
  getExecutiveAlerts,
  loadExecutiveAlertSources,
  type ExecutiveAlert,
  type ExecutiveAlertSourceBundle,
  type ExecutiveAlertStream,
} from "@/lib/platform/executive-alerts";
import {
  getExecutiveDecisionQueue,
  type ExecutiveDecision,
  type ExecutiveDecisionQueue,
} from "@/lib/platform/executive-decisions";
import {
  loadKpiSnapshotPair,
  type KpiSnapshotPair,
} from "@/lib/dashboard/morning-brief/kpi-compare";
import { getMissionControlFeed } from "@/lib/platform/automation/mission-control";
import { resolveJagWorkQueue } from "@/lib/platform/jag-work";
import type { JagWorkItem, JagWorkQueue } from "@/lib/platform/jag-work";
import { resolveSchoolContext } from "@/lib/platform/shared/context";
import type { CommandCenterMetrics } from "@/lib/executive/types";
import type { MissionControlPriorityItem } from "@/lib/platform/automation/mission-control-compose";
import type { ExecutableWorkspaceState } from "@/lib/platform/execution-engine/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ExecutiveIntelligenceWorkspace {
  filters: ExecutiveMetricsFilters;
  schoolId: string | undefined;
  organizationId: string | null;
  loadedAt: string;
  alertSources: ExecutiveAlertSourceBundle;
  aggregate: ExecutiveAggregateMetrics | null;
  alerts: ExecutiveAlertStream;
  decisions: ExecutiveDecisionQueue;
  kpiPair: KpiSnapshotPair;
  missionControlFeed: Awaited<ReturnType<typeof getMissionControlFeed>>;
  missionControlCritical: MissionControlPriorityItem[];
  commandCenterMetrics: CommandCenterMetrics;
  jagWork: JagWorkQueue;
}

function criticalFromFeed(
  feed: Awaited<ReturnType<typeof getMissionControlFeed>>
): MissionControlPriorityItem[] {
  return feed
    .filter((i) => (i.severity ?? "").toLowerCase() === "critical")
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.body ?? "",
      severity: "critical" as const,
      href: item.href,
      source: "mission_control" as const,
      module: item.module,
      entityType: item.entity_type,
      entityId: item.entity_id,
      createdAt: item.created_at,
    }));
}

export interface LoadExecutiveIntelligenceWorkspaceOptions {
  filters?: ExecutiveMetricsFilters;
  schoolId?: string;
  jagWorkPerspective?: string;
  decisionLimit?: number;
  alertLimit?: number;
  includeJagWork?: boolean;
  engineRecommendations?: {
    id: string;
    title: string;
    rationale: string;
    priority: "high" | "medium" | "low";
  }[];
  executionState?: ExecutableWorkspaceState | null;
}

/**
 * Canonical load path for Founder / Executive / Mission Control consumers.
 */
export async function loadExecutiveIntelligenceWorkspace(
  supabase: AuthClient,
  identity: IdentityContext,
  options: LoadExecutiveIntelligenceWorkspaceOptions = {}
): Promise<ExecutiveIntelligenceWorkspace> {
  return observeExecutiveIntelligence("executive.loadIntelligenceWorkspace", () =>
    loadExecutiveIntelligenceWorkspaceInner(supabase, identity, options)
  );
}

async function loadExecutiveIntelligenceWorkspaceInner(
  supabase: AuthClient,
  identity: IdentityContext,
  options: LoadExecutiveIntelligenceWorkspaceOptions = {}
): Promise<ExecutiveIntelligenceWorkspace> {
  const schoolId =
    options.schoolId ??
    identity.orgAssignments.find((a) => a.is_primary)?.school_id ??
    identity.accessibleSchoolIds[0];

  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  const organizationId =
    options.filters?.organizationId ?? schoolCtx?.organizationId ?? null;

  const filters: ExecutiveMetricsFilters = {
    organizationId,
    schoolId: schoolId ?? null,
    campusId: options.filters?.campusId ?? schoolCtx?.campusId ?? null,
    regionId: options.filters?.regionId ?? null,
    programId: options.filters?.programId ?? null,
    program: options.filters?.program ?? null,
    networkId: options.filters?.networkId ?? null,
  };

  const loadedAt = new Date().toISOString();
  const includeJagWork = options.includeJagWork !== false;

  const alertSources = await loadExecutiveAlertSources(supabase, filters);
  const missionControlFeed = alertSources.missionControl as Awaited<
    ReturnType<typeof getMissionControlFeed>
  >;
  const criticalCount = missionControlFeed.filter(
    (i) => (i.severity ?? "").toLowerCase() === "critical"
  ).length;

  const [alerts, kpiPair, jagWork] = await Promise.all([
    getExecutiveAlerts(supabase, {
      filters,
      limit: options.alertLimit ?? 40,
      preloadedSources: alertSources,
    }),
    loadKpiSnapshotPair(supabase, {
      networkId: filters.networkId ?? null,
      regionId: filters.regionId ?? null,
      campusId: filters.campusId ?? null,
      programId: filters.programId ?? null,
      program: filters.program ?? null,
      organizationId: filters.organizationId ?? null,
      schoolId: filters.schoolId ?? null,
    }),
    includeJagWork
      ? resolveJagWorkQueue({
          workspaceKey: "executive",
          input: {
            supabase,
            identity,
            activePerspective: options.jagWorkPerspective ?? "needs_human_decision",
            insights: [],
            complianceAlerts: alertSources.compliance?.overdue ?? 0,
            missionControlCritical: criticalCount,
            engineRecommendations: options.engineRecommendations ?? [],
            executionState: options.executionState ?? null,
          },
        })
      : Promise.resolve({
          workspaceKey: "executive",
          resolvedAt: loadedAt,
          activePerspective: "needs_human_decision",
          perspectiveCatalog: [],
          perspectives: {},
          allItems: [] as JagWorkItem[],
          counts: {},
        } satisfies JagWorkQueue),
  ]);

  const decisions = await getExecutiveDecisionQueue(supabase, {
    filters,
    limit: options.decisionLimit ?? 25,
    jagWorkItems: jagWork.allItems,
    preloadedAlerts: alerts.alerts,
    preloadedMissionControl: missionControlFeed,
    preloadedActivity: alertSources.activity,
    preloadedKpiSnapshots: kpiPair.current.filter(
      (r) =>
        r.status === "critical" || r.status === "at_risk" || r.status === "watch"
    ),
  });

  const aggregate =
    alertSources.aggregate ??
    (await getExecutiveAggregateMetrics(supabase, filters).catch(() => null));

  const commandCenterMetrics = aggregateToCommandCenterMetrics(aggregate, {
    missionControlOpen: missionControlFeed.length,
    missionControlCritical: criticalCount,
  });

  return {
    filters,
    schoolId,
    organizationId,
    loadedAt,
    alertSources,
    aggregate,
    alerts,
    decisions,
    kpiPair,
    missionControlFeed,
    missionControlCritical: criticalFromFeed(missionControlFeed),
    commandCenterMetrics,
    jagWork,
  };
}

export function topOpenDecisions(
  queue: ExecutiveDecisionQueue,
  limit = 5
): ExecutiveDecision[] {
  return queue.decisions
    .filter((d) => d.status !== "Completed" && d.status !== "Dismissed")
    .slice(0, limit);
}

export function alertsToFounderCards(
  alerts: ExecutiveAlert[],
  limit = 5
): {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  href: string | null;
}[] {
  return alerts.slice(0, limit).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.description,
    severity: a.severity.toLowerCase(),
    href: a.missionControlReference
      ? "/dashboard/mission-control"
      : "/dashboard/executive",
  }));
}
