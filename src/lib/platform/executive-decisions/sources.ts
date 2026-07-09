/**
 * Load existing platform signals for the Executive Decision Queue.
 * Does not invent a second work queue — reuses JAG Work, MC, Workflow, Alerts, KPI, Activity.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getActivityFeed } from "@/lib/platform/activity/query";
import { getMissionControlFeed } from "@/lib/platform/automation/mission-control";
import {
  getExecutiveAlerts,
  type ExecutiveAlert,
} from "@/lib/platform/executive-alerts";
import {
  loadLatestKpiSnapshots,
} from "@/lib/platform/executive-alerts/sources";
import {
  resolveExecutiveMetricsScope,
  resolveSchoolScopeId,
} from "@/lib/platform/executive-metrics";
import type { KpiSnapshotRecord } from "@/lib/platform/kpi-snapshots";
import type { JagWorkItem } from "@/lib/platform/jag-work/types";
import type {
  ExecutiveDecisionsFilters,
  ExecutiveDecisionsScope,
} from "@/lib/platform/executive-decisions/types";
import type {
  ActivityDecisionLike,
  MissionControlDecisionLike,
  WorkflowApprovalDecisionLike,
} from "@/lib/platform/executive-decisions/adapters";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ExecutiveDecisionSourceBundle {
  loadedAt: string;
  scope: ExecutiveDecisionsScope;
  schoolId: string | undefined;
  alerts: ExecutiveAlert[];
  missionControl: MissionControlDecisionLike[];
  jagWork: JagWorkItem[];
  workflowApprovals: WorkflowApprovalDecisionLike[];
  activity: ActivityDecisionLike[];
  kpiSnapshots: KpiSnapshotRecord[];
}

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export function resolveExecutiveDecisionsScope(
  filters: ExecutiveDecisionsFilters = {}
): ExecutiveDecisionsScope {
  return resolveExecutiveMetricsScope(filters);
}

/**
 * Pending workflow approvals across active instances (org/school scoped when possible).
 * Uses existing Workflow Engine tables — does not create a new engine.
 */
export async function loadPendingWorkflowApprovals(
  supabase: AuthClient,
  scope: ExecutiveDecisionsScope
): Promise<WorkflowApprovalDecisionLike[]> {
  let query = supabase
    .from("platform_workflow_approvals")
    .select(
      "id, instance_id, transition_key, gate_key, status, requested_by, created_at, metadata, platform_workflow_instances(workflow_key, domain, entity_type, entity_id, school_id, organization_id, status)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data, error } = await query;
  if (error || !data) return [];

  const schoolId = resolveSchoolScopeId(scope);

  const rows: WorkflowApprovalDecisionLike[] = [];
  for (const row of data as Array<Record<string, unknown>>) {
    const instance = row.platform_workflow_instances as
      | {
          workflow_key?: string;
          domain?: string;
          entity_type?: string;
          entity_id?: string;
          school_id?: string | null;
          organization_id?: string | null;
          status?: string;
        }
      | {
          workflow_key?: string;
          domain?: string;
          entity_type?: string;
          entity_id?: string;
          school_id?: string | null;
          organization_id?: string | null;
          status?: string;
        }[]
      | null;

    const inst = Array.isArray(instance) ? instance[0] : instance;
    if (inst?.status && inst.status !== "active") continue;

    if (schoolId && inst?.school_id && inst.school_id !== schoolId) continue;
    if (
      scope.organizationId &&
      inst?.organization_id &&
      inst.organization_id !== scope.organizationId
    ) {
      continue;
    }

    rows.push({
      id: String(row.id),
      instance_id: String(row.instance_id),
      transition_key: String(row.transition_key),
      gate_key: String(row.gate_key),
      status: String(row.status),
      requested_by: (row.requested_by as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? {},
      workflow_key: inst?.workflow_key ?? null,
      domain: inst?.domain ?? null,
      entity_type: inst?.entity_type ?? null,
      entity_id: inst?.entity_id ?? null,
      school_id: inst?.school_id ?? null,
    });
  }
  return rows;
}

export interface LoadExecutiveDecisionSourcesOptions {
  jagWorkItems?: JagWorkItem[];
  /** Skip getExecutiveAlerts when Morning Brief already composed the stream. */
  preloadedAlerts?: ExecutiveAlert[];
  /** Skip MC feed when already loaded. */
  preloadedMissionControl?: MissionControlDecisionLike[];
  /** Skip activity feed when already loaded. */
  preloadedActivity?: ActivityDecisionLike[];
  /** Skip KPI snapshot load when already loaded. */
  preloadedKpiSnapshots?: KpiSnapshotRecord[];
}

/**
 * Optional pre-resolved inputs (e.g. from Morning Brief) to avoid duplicate queries.
 * When omitted, getExecutiveDecisionQueue still works from other sources.
 */
export async function loadExecutiveDecisionSources(
  supabase: AuthClient,
  filters: ExecutiveDecisionsFilters = {},
  options: LoadExecutiveDecisionSourcesOptions = {}
): Promise<ExecutiveDecisionSourceBundle> {
  const scope = resolveExecutiveDecisionsScope(filters);
  const schoolId = resolveSchoolScopeId(scope);
  const loadedAt = new Date().toISOString();

  const [alertStream, missionControl, workflowApprovals, activity, kpiSnapshots] =
    await Promise.all([
      options.preloadedAlerts
        ? Promise.resolve(null)
        : settled(
            getExecutiveAlerts(supabase, {
              filters,
              limit: 40,
            })
          ),
      options.preloadedMissionControl
        ? Promise.resolve(options.preloadedMissionControl)
        : settled(
            getMissionControlFeed(supabase, {
              schoolId,
              limit: 50,
            })
          ).then((r) => (r ?? []) as MissionControlDecisionLike[]),
      settled(loadPendingWorkflowApprovals(supabase, scope)).then((r) => r ?? []),
      options.preloadedActivity
        ? Promise.resolve(options.preloadedActivity)
        : settled(
            getActivityFeed(supabase, {
              organizationId: scope.organizationId ?? undefined,
              limit: 40,
            })
          ).then((r) => (r ?? []) as ActivityDecisionLike[]),
      options.preloadedKpiSnapshots
        ? Promise.resolve(options.preloadedKpiSnapshots)
        : settled(loadLatestKpiSnapshots(supabase, scope)).then((r) => r ?? []),
    ]);

  return {
    loadedAt,
    scope,
    schoolId,
    alerts: options.preloadedAlerts ?? alertStream?.alerts ?? [],
    missionControl: missionControl ?? [],
    jagWork: options.jagWorkItems ?? [],
    workflowApprovals,
    activity: activity ?? [],
    kpiSnapshots: kpiSnapshots ?? [],
  };
}
