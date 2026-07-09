import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  ExecutiveAlertDraft,
  ExecutiveAlertStream,
  GetExecutiveAlertsOptions,
} from "@/lib/platform/executive-alerts/types";
import { buildExecutiveAlerts } from "@/lib/platform/executive-alerts/build";
import { loadExecutiveAlertSources } from "@/lib/platform/executive-alerts/sources";
import {
  adaptActivityEvents,
  adaptAdmissionsSignals,
  adaptComplianceSignals,
  adaptExecutiveInsights,
  adaptExecutiveMetrics,
  adaptFinancialAlerts,
  adaptHrSignals,
  adaptKpiSnapshots,
  adaptMissionControlItems,
  adaptOperationalLoopSignals,
} from "@/lib/platform/executive-alerts/adapters";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Collect drafts from every registered source adapter.
 * Pure relative to the source bundle — easy to unit test.
 */
export function collectAlertDrafts(
  sources: Awaited<ReturnType<typeof loadExecutiveAlertSources>>
): ExecutiveAlertDraft[] {
  const { scope, loadedAt } = sources;
  const drafts: ExecutiveAlertDraft[] = [];

  drafts.push(...adaptKpiSnapshots(sources.kpiSnapshots, scope));
  if (sources.aggregate) {
    drafts.push(...adaptExecutiveMetrics(sources.aggregate, scope));
  }
  drafts.push(...adaptActivityEvents(sources.activity, scope));
  drafts.push(...adaptFinancialAlerts(sources.financialAlerts, scope));
  drafts.push(...adaptMissionControlItems(sources.missionControl, scope));
  drafts.push(...adaptComplianceSignals(sources.compliance, scope, loadedAt));
  drafts.push(...adaptHrSignals(sources.workforce, scope, loadedAt));
  drafts.push(...adaptAdmissionsSignals(sources.admissions, scope, loadedAt));
  drafts.push(...adaptOperationalLoopSignals(sources.operationalLoop, scope, loadedAt));
  drafts.push(...adaptExecutiveInsights(sources.insights, scope));

  return drafts;
}

export interface GetExecutiveAlertsExtra {
  /**
   * Pass a preloaded source bundle (e.g. from Morning Brief) to avoid
   * re-querying metrics / MC / FI / activity.
   */
  preloadedSources?: Awaited<ReturnType<typeof loadExecutiveAlertSources>>;
}

/**
 * Platform entrypoint: consume existing services → unified executive alert stream.
 * Does not write a second notification store or work queue.
 */
export async function getExecutiveAlerts(
  supabase: AuthClient,
  options: GetExecutiveAlertsOptions & GetExecutiveAlertsExtra = {}
): Promise<ExecutiveAlertStream> {
  const sources =
    options.preloadedSources ??
    (await loadExecutiveAlertSources(supabase, options.filters ?? {}));
  const drafts = collectAlertDrafts(sources);
  const stream = buildExecutiveAlerts({
    scope: sources.scope,
    drafts,
    builtAt: sources.loadedAt,
    includeClosed: options.includeClosed,
  });

  if (options.limit != null && options.limit >= 0) {
    return {
      ...stream,
      alerts: stream.alerts.slice(0, options.limit),
    };
  }

  return stream;
}
