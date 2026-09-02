import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export type GoogleSyncMode = "manual" | "scheduled" | "incremental" | "full" | "retry";

export type GoogleSyncTriggeredBy =
  | "manual"
  | "scheduler"
  | "webhook"
  | "retry"
  | "install";

export type GoogleSyncRunStatus =
  | "running"
  | "succeeded"
  | "failed"
  | "partial"
  | "cancelled";

export type GoogleSyncRun = {
  id: string;
  connectionId: string;
  organizationId: string;
  provider: "google_workspace";
  jobId: string;
  mode: GoogleSyncMode;
  status: GoogleSyncRunStatus;
  triggeredBy: GoogleSyncTriggeredBy;
  objectTypes: string[];
  recordsFetched: number;
  recordsNormalized: number;
  recordsChanged: number;
  durationMs: number | null;
  cursor: string | null;
  error: string | null;
  providerVersion: string | null;
  tokenExpiresAt: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type GoogleSyncRegistry = {
  connectionId: string;
  organizationId: string;
  provider: "google_workspace";
  enabled: boolean;
  incrementalCron: string;
  fullCron: string;
  nextIncrementalAt: string | null;
  nextFullAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastAttemptedSyncAt: string | null;
  consecutiveFailures: number;
  updatedAt: string;
};

export type GoogleSyncOptions = {
  organizationId: string;
  mode?: GoogleSyncMode;
  triggeredBy?: GoogleSyncTriggeredBy;
  objectTypes?: readonly GoogleWorkspaceObjectType[] | readonly string[];
  /** Force full even when mode is scheduled. */
  forceFull?: boolean;
  /**
   * Run against the fixture client instead of Google.
   *
   * Off by default and deliberately awkward to reach: without it, a sync in an
   * environment missing Google credentials fails loudly rather than importing
   * demo records into a real knowledge graph. Tests and demo orgs opt in; nothing
   * in a production path should.
   */
  allowDemoClient?: boolean;
};

export type GoogleSyncResult = {
  ok: boolean;
  run: GoogleSyncRun;
  recordsImported: number;
  durationMs: number;
  nextIncrementalAt: string | null;
  nextFullAt: string | null;
};

export type GoogleSyncProgressStatus = {
  currentStatus: GoogleSyncRunStatus | "idle";
  lastSuccessfulSyncAt: string | null;
  lastAttemptedSyncAt: string | null;
  lastSyncDurationMs: number | null;
  recordsImported: number;
  recordsChanged: number;
  nextScheduledSyncAt: string | null;
  nextFullSyncAt: string | null;
  consecutiveFailures: number;
  errorDetails: string | null;
  recentRuns: GoogleSyncRun[];
  providerVersion: string;
  tokenExpiresAt: string | null;
};

export type SyncSliceResult = {
  objectType: string;
  fetched: number;
  normalized: number;
  cursor: string | null;
};
