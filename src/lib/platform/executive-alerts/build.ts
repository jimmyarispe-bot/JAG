import type {
  BuildExecutiveAlertsInput,
  ExecutiveAlertStream,
} from "@/lib/platform/executive-alerts/types";
import { dedupeAlerts } from "@/lib/platform/executive-alerts/dedupe";

/**
 * Pure composer: drafts → deduped, scored executive alert stream.
 * Used by getExecutiveAlerts after adapters run, and by unit tests.
 */
export function buildExecutiveAlerts(
  input: BuildExecutiveAlertsInput
): ExecutiveAlertStream {
  const { alerts, rawDraftCount, dedupedAway } = dedupeAlerts(input.drafts);
  const includeClosed = input.includeClosed ?? false;
  const filtered = includeClosed
    ? alerts
    : alerts.filter((a) => a.status === "open" || a.status === "acknowledged");

  return {
    scope: input.scope,
    builtAt: input.builtAt ?? new Date().toISOString(),
    alerts: filtered,
    rawDraftCount,
    dedupedAway,
  };
}
