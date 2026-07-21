export type IntegrationConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "pending";

export type IntegrationConnectionHealth =
  | "healthy"
  | "warning"
  | "error"
  | "disconnected"
  | "unknown";

export type IntegrationConnectionRow = {
  id: string;
  organization_id: string;
  provider: string;
  status: IntegrationConnectionStatus;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  connected_by: string | null;
  created_at: string;
  updated_at: string;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_sync_error?: string | null;
  last_sync_duration_ms?: number | null;
  last_sync_records?: number | null;
  records_imported?: number | null;
};

/** Safe status payload for UI / GET status — never includes tokens. */
export type GoogleWorkspaceConnectionStatus = {
  provider: "google_workspace";
  status: IntegrationConnectionStatus;
  connected: boolean;
  health: IntegrationConnectionHealth;
  healthLabel: string;
  lastSyncAt: string | null;
  expiresAt: string | null;
  connectedAt: string | null;
  connectionId: string | null;
  /** RC-2.02 sync telemetry */
  currentSyncStatus: "idle" | "running" | "succeeded" | "failed" | "partial" | "cancelled";
  recordsImported: number;
  recordsChanged: number;
  lastSyncDurationMs: number | null;
  nextScheduledSyncAt: string | null;
  nextFullSyncAt: string | null;
  consecutiveFailures: number;
  errorDetails: string | null;
  providerVersion: string | null;
};

/** RC-3.01 — Microsoft 365 connection status (parity with Google Workspace). */
export type Microsoft365ConnectionStatus = {
  provider: "microsoft_365";
  status: IntegrationConnectionStatus;
  connected: boolean;
  health: IntegrationConnectionHealth;
  healthLabel: string;
  lastSyncAt: string | null;
  expiresAt: string | null;
  connectedAt: string | null;
  connectionId: string | null;
  currentSyncStatus: "idle" | "running" | "succeeded" | "failed" | "partial" | "cancelled";
  recordsImported: number;
  recordsChanged: number;
  lastSyncDurationMs: number | null;
  nextScheduledSyncAt: string | null;
  nextFullSyncAt: string | null;
  consecutiveFailures: number;
  errorDetails: string | null;
  providerVersion: string | null;
};
