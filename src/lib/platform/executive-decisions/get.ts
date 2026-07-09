import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { JagWorkItem } from "@/lib/platform/jag-work/types";
import type {
  ExecutiveDecisionDraft,
  ExecutiveDecisionQueue,
  GetExecutiveDecisionQueueOptions,
} from "@/lib/platform/executive-decisions/types";
import { buildExecutiveDecisionQueue } from "@/lib/platform/executive-decisions/build";
import { loadExecutiveDecisionSources } from "@/lib/platform/executive-decisions/sources";
import {
  adaptActivityDecisions,
  adaptExecutiveAlerts,
  adaptJagWorkDecisions,
  adaptKpiSnapshotDecisions,
  adaptMissionControlDecisions,
  adaptWorkflowApprovals,
} from "@/lib/platform/executive-decisions/adapters";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Collect drafts from every registered decision source adapter.
 */
export function collectDecisionDrafts(
  sources: Awaited<ReturnType<typeof loadExecutiveDecisionSources>>
): ExecutiveDecisionDraft[] {
  const { scope } = sources;
  const drafts: ExecutiveDecisionDraft[] = [];

  drafts.push(...adaptExecutiveAlerts(sources.alerts, scope));
  drafts.push(...adaptMissionControlDecisions(sources.missionControl, scope));
  drafts.push(...adaptJagWorkDecisions(sources.jagWork, scope));
  drafts.push(...adaptWorkflowApprovals(sources.workflowApprovals, scope));
  drafts.push(...adaptActivityDecisions(sources.activity, scope));
  drafts.push(...adaptKpiSnapshotDecisions(sources.kpiSnapshots, scope));

  return drafts;
}

export interface GetExecutiveDecisionQueueExtra {
  /** Pass pre-resolved JAG Work (e.g. from resolveJagWorkQueue) to avoid a second resolve. */
  jagWorkItems?: JagWorkItem[];
  /** Pass preloaded alerts / MC / activity / KPI rows to avoid duplicate platform queries. */
  preloadedAlerts?: import("@/lib/platform/executive-alerts").ExecutiveAlert[];
  preloadedMissionControl?: import("@/lib/platform/executive-decisions/adapters").MissionControlDecisionLike[];
  preloadedActivity?: import("@/lib/platform/executive-decisions/adapters").ActivityDecisionLike[];
  preloadedKpiSnapshots?: import("@/lib/platform/kpi-snapshots").KpiSnapshotRecord[];
}

/**
 * Platform entrypoint: unified executive decision queue over existing systems.
 * Does not create a second work queue or workflow engine.
 */
export async function getExecutiveDecisionQueue(
  supabase: AuthClient,
  options: GetExecutiveDecisionQueueOptions & GetExecutiveDecisionQueueExtra = {}
): Promise<ExecutiveDecisionQueue> {
  const sources = await loadExecutiveDecisionSources(
    supabase,
    options.filters ?? {},
    {
      jagWorkItems: options.jagWorkItems,
      preloadedAlerts: options.preloadedAlerts,
      preloadedMissionControl: options.preloadedMissionControl,
      preloadedActivity: options.preloadedActivity,
      preloadedKpiSnapshots: options.preloadedKpiSnapshots,
    }
  );
  const drafts = collectDecisionDrafts(sources);
  let queue = buildExecutiveDecisionQueue({
    scope: sources.scope,
    drafts,
    builtAt: sources.loadedAt,
    includeClosed: options.includeClosed,
  });

  if (options.decisionTypes?.length) {
    const allowed = new Set(options.decisionTypes);
    const decisions = queue.decisions.filter((d) => allowed.has(d.decisionType));
    queue = { ...queue, decisions };
  }

  if (options.limit != null && options.limit >= 0) {
    queue = {
      ...queue,
      decisions: queue.decisions.slice(0, options.limit),
    };
  }

  return queue;
}
