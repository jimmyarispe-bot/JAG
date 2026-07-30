/**
 * Executive Inbox loaders — Sprint 206.
 */

import {
  DIGEST_KINDS,
  WatcherService,
  listWatcherObservations,
  type DigestKind,
  type WatcherAlert,
  type WatcherDigest,
} from "@/lib/platform/intelligence/watchers/index";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { buildWatcherEvaluationContext } from "./build-context";

export { listWatcherObservations };

export type JagInboxWorkspaceModel = {
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly organizations: readonly { id: string; label: string }[];
  readonly alerts: readonly WatcherAlert[];
  readonly selected: WatcherAlert | null;
  readonly digests: readonly WatcherDigest[];
  readonly latestDigest: WatcherDigest | null;
  readonly digestKinds: readonly DigestKind[];
  readonly counts: {
    readonly open: number;
    readonly critical: number;
    readonly high: number;
    readonly acknowledged: number;
  };
  readonly evaluation: {
    readonly created: number;
    readonly merged: number;
    readonly suppressed: number;
    readonly durationMs: number;
    readonly observationId: string | null;
  };
  readonly advisoryNotice: string;
  readonly explanation: string;
};

export function loadExecutiveInbox(
  session: JagPlatformSession,
  options?: {
    readonly organizationId?: string;
    readonly alertId?: string;
    readonly digest?: DigestKind;
  }
): JagInboxWorkspaceModel {
  const orgs = listOrganizationsForSession(session);
  const org =
    orgs.find((o) => o.id === options?.organizationId) ?? orgs[0] ?? null;

  const advisoryNotice =
    "Executive Inbox — proactive findings for attention. JAG never executes organizational decisions.";

  if (!org) {
    return {
      organizationId: null,
      organizationName: null,
      organizations: [],
      alerts: [],
      selected: null,
      digests: [],
      latestDigest: null,
      digestKinds: DIGEST_KINDS,
      counts: { open: 0, critical: 0, high: 0, acknowledged: 0 },
      evaluation: {
        created: 0,
        merged: 0,
        suppressed: 0,
        durationMs: 0,
        observationId: null,
      },
      advisoryNotice,
      explanation: "Select an organization to evaluate watchers.",
    };
  }

  const ctx = buildWatcherEvaluationContext({
    session,
    organizationId: org.id,
    organizationName: org.name,
  });

  const run = WatcherService.evaluate(ctx);

  const digestKind = options?.digest;
  const latestDigest = digestKind
    ? WatcherService.buildDigest({
        organizationId: org.id,
        organizationName: org.name,
        kind: digestKind,
      })
    : WatcherService.listDigests(org.id)[0] ?? null;

  const alerts = WatcherService.listOpen(org.id);
  const all = WatcherService.listAll(org.id);
  const selected = options?.alertId
    ? WatcherService.get(options.alertId)
    : alerts[0] ?? null;

  return {
    organizationId: org.id,
    organizationName: org.name,
    organizations: orgs.map((o) => ({ id: o.id, label: o.name })),
    alerts,
    selected,
    digests: WatcherService.listDigests(org.id).slice(0, 10),
    latestDigest,
    digestKinds: DIGEST_KINDS,
    counts: {
      open: alerts.filter((a) => a.status === "open").length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      high: alerts.filter((a) => a.severity === "high").length,
      acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    },
    evaluation: {
      created: run.created,
      merged: run.merged,
      suppressed: run.suppressed,
      durationMs: run.durationMs,
      observationId: run.observationId,
    },
    advisoryNotice,
    explanation: [
      `Evaluated organizational conditions for ${org.name}.`,
      `${alerts.length} open attention item(s).`,
      "Duplicates merged; dismissed fingerprints suppressed for 24h.",
      all.length === 0
        ? "No material findings — quality over quantity."
        : null,
    ]
      .filter(Boolean)
      .join(" "),
  };
}
