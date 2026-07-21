import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export type MicrosoftSyncMode = "manual" | "scheduled" | "incremental" | "full" | "retry";

export type MicrosoftSyncTriggeredBy =
  | "manual"
  | "scheduler"
  | "webhook"
  | "retry"
  | "install";

export type MicrosoftSyncRunStatus =
  | "running"
  | "succeeded"
  | "failed"
  | "partial"
  | "cancelled";

export type MicrosoftSyncRun = {
  id: string;
  connectionId: string;
  organizationId: string;
  provider: "microsoft_365";
  jobId: string;
  mode: MicrosoftSyncMode;
  status: MicrosoftSyncRunStatus;
  triggeredBy: MicrosoftSyncTriggeredBy;
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

export type MicrosoftSyncRegistry = {
  connectionId: string;
  organizationId: string;
  provider: "microsoft_365";
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

export type MicrosoftSyncOptions = {
  organizationId: string;
  mode?: MicrosoftSyncMode;
  triggeredBy?: MicrosoftSyncTriggeredBy;
  objectTypes?: readonly Microsoft365ObjectType[] | readonly string[];
  forceFull?: boolean;
};

export type MicrosoftSyncResult = {
  ok: boolean;
  run: MicrosoftSyncRun;
  recordsImported: number;
  durationMs: number;
  nextIncrementalAt: string | null;
  nextFullAt: string | null;
};

export type MicrosoftSyncProgressStatus = {
  currentStatus: MicrosoftSyncRunStatus | "idle";
  lastSuccessfulSyncAt: string | null;
  lastAttemptedSyncAt: string | null;
  lastSyncDurationMs: number | null;
  recordsImported: number;
  recordsChanged: number;
  nextScheduledSyncAt: string | null;
  nextFullSyncAt: string | null;
  consecutiveFailures: number;
  errorDetails: string | null;
  recentRuns: MicrosoftSyncRun[];
  providerVersion: string;
  tokenExpiresAt: string | null;
};
