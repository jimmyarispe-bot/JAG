/** Connector Framework™ — metadata & interfaces only (no production connectors). */

export const CONNECTOR_CATEGORIES = [
  "Finance",
  "Productivity",
  "CRM",
  "HR",
  "Payments",
  "Banking",
  "Project Management",
  "Education",
  "Healthcare",
  "Real Estate",
  "Manufacturing",
  "Nonprofit",
] as const;

export type ConnectorCategory = (typeof CONNECTOR_CATEGORIES)[number];

export const AUTHENTICATION_TYPES = [
  "OAuth 2.0",
  "API Key",
  "Username / Password",
  "Service Account",
  "Manual Import",
] as const;

export type AuthenticationType = (typeof AUTHENTICATION_TYPES)[number];

export const SYNC_TYPES = [
  "Manual",
  "Scheduled",
  "Webhook",
  "Real-time",
] as const;

export type SyncType = (typeof SYNC_TYPES)[number];

export const SCHEDULE_FREQUENCIES = [
  "Manual",
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
] as const;

export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export const CONNECTOR_STATUSES = [
  "Not Installed",
  "Installed",
  "Connected",
  "Disconnected",
  "Syncing",
  "Disabled",
  "Error",
] as const;

export type ConnectorStatus = (typeof CONNECTOR_STATUSES)[number];

export const CONNECTOR_HEALTH = [
  "Healthy",
  "Warning",
  "Offline",
  "Error",
] as const;

export type ConnectorHealth = (typeof CONNECTOR_HEALTH)[number];

export type ConnectorCapability =
  | "read"
  | "write"
  | "sync"
  | "webhook"
  | "import";

export type ConnectorDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly category: ConnectorCategory;
  readonly description: string;
  readonly version: string;
  readonly vendor: string;
  readonly authenticationType: AuthenticationType;
  readonly availability: "coming_soon" | "available";
  readonly capabilities: readonly ConnectorCapability[];
  readonly supportedSyncTypes: readonly SyncType[];
  readonly supportedEvidenceDomains: readonly string[];
};

export type ConnectorInstallation = {
  readonly id: string;
  readonly organizationId: string;
  readonly connectorId: string;
  readonly status: ConnectorStatus;
  readonly health: ConnectorHealth;
  readonly enabled: boolean;
  readonly version: string;
  readonly lastSyncAt: string | null;
  readonly nextScheduledSyncAt: string | null;
  readonly scheduleFrequency: ScheduleFrequency;
  readonly companyName: string | null;
  readonly companyId: string | null;
  readonly lastError: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ConnectorCredentialRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly installationId: string;
  readonly authenticationType: AuthenticationType;
  /** Encrypted payload — never log. */
  readonly encryptedPayload: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ConnectorSyncJob = {
  readonly id: string;
  readonly organizationId: string;
  readonly installationId: string;
  readonly connectorId: string;
  readonly status: "Pending" | "Running" | "Completed" | "Failed";
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly lastError: string | null;
  readonly recordsImported: number;
  readonly failureCount: number;
  readonly durationMs: number | null;
  readonly createdAt: string;
};

export type ConnectorSyncEvent = {
  readonly id: string;
  readonly organizationId: string;
  readonly syncJobId: string;
  readonly eventName: string;
  readonly message: string;
  readonly at: string;
};

export type ConnectorConfiguration = {
  readonly organizationId: string;
  readonly installationId: string;
  readonly scheduleFrequency: ScheduleFrequency;
  readonly enabled: boolean;
  readonly settings: Readonly<Record<string, string>>;
};

export type ConnectorDashboardMetrics = {
  readonly installedConnectors: number;
  readonly connectedSystems: number;
  readonly healthyConnectors: number;
  readonly failedSyncs: number;
  readonly pendingSyncs: number;
  readonly lastActivity: string | null;
};
