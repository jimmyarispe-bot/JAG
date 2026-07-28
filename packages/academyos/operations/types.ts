/**
 * AcademyOS RC-3 — Operations types.
 */

export type OpsEnvironment = "development" | "production" | "test";

export type OpsSeverity = "info" | "warning" | "error" | "critical";

export type HealthStatus = "Healthy" | "Warning" | "Critical";

export type OpsCheck = {
  readonly id: string;
  readonly name: string;
  readonly ok: boolean;
  readonly severity: OpsSeverity;
  readonly detail: string;
  readonly evidence: readonly string[];
  readonly recommendation?: string;
};

export type DeploymentReport = {
  readonly generatedAt: string;
  readonly environment: OpsEnvironment;
  readonly passed: boolean;
  readonly checks: readonly OpsCheck[];
  readonly missingRequired: readonly string[];
  readonly versionCompatibility: {
    readonly packVersion: string;
    readonly platformMin: string;
    readonly sdkMin: string;
    readonly compatible: boolean;
  };
  readonly summary: string;
};

export type ConfigurationReport = {
  readonly generatedAt: string;
  readonly environment: OpsEnvironment;
  readonly passed: boolean;
  readonly missing: readonly string[];
  readonly invalid: readonly string[];
  readonly deprecated: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
  readonly checks: readonly OpsCheck[];
};

export type HealthCategory =
  | "Application"
  | "Database"
  | "Authentication"
  | "Connectors"
  | "Executive Intelligence"
  | "Studio Integration"
  | "Storage"
  | "Notifications"
  | "Background Jobs";

export type HealthCategoryResult = {
  readonly category: HealthCategory;
  readonly status: HealthStatus;
  readonly checks: readonly OpsCheck[];
  readonly detail: string;
};

export type HealthReport = {
  readonly generatedAt: string;
  readonly status: HealthStatus;
  readonly categories: readonly HealthCategoryResult[];
  readonly summary: string;
};

export type MonitoringMetric = {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly value: number;
  readonly baseline: number;
  readonly status: HealthStatus;
  readonly evidence: readonly string[];
};

export type MonitoringReport = {
  readonly generatedAt: string;
  readonly metrics: readonly MonitoringMetric[];
  readonly trend: readonly {
    readonly at: string;
    readonly errorRate: number;
    readonly apiLatencyMs: number;
    readonly overallStatus: HealthStatus;
  }[];
  readonly summary: string;
};

export type BackupValidationReport = {
  readonly generatedAt: string;
  readonly passed: boolean;
  readonly workflows: readonly {
    readonly id: string;
    readonly name: string;
    readonly documented: boolean;
    readonly verified: boolean;
    readonly detail: string;
  }[];
  readonly restoreVerified: boolean;
  readonly summary: string;
  readonly recommendations: readonly string[];
};

export type UpgradeReport = {
  readonly generatedAt: string;
  readonly passed: boolean;
  readonly fromStage: string;
  readonly toStage: string;
  readonly migrationOrderingOk: boolean;
  readonly compatibilityOk: boolean;
  readonly rollbackReady: boolean;
  readonly releaseNotesPresent: boolean;
  readonly checklist: readonly OpsCheck[];
  readonly summary: string;
};

export type DiagnosticsReport = {
  readonly generatedAt: string;
  readonly passed: boolean;
  readonly status: HealthStatus;
  readonly findings: readonly OpsCheck[];
  readonly actionable: readonly string[];
  readonly summary: string;
};

export type DemoOrganizationSeed = {
  readonly organizationId: string;
  readonly createdAt: string;
  readonly counts: Readonly<Record<string, number>>;
  readonly workflowsExercised: readonly string[];
  readonly summary: string;
};

export type OperationsDashboard = {
  readonly generatedAt: string;
  readonly environment: OpsEnvironment;
  readonly deploymentStatus: HealthStatus;
  readonly configurationStatus: HealthStatus;
  readonly healthStatus: HealthStatus;
  readonly diagnosticsStatus: HealthStatus;
  readonly upgradeReadiness: HealthStatus;
  readonly backupValidation: HealthStatus;
  readonly connectorStatus: HealthStatus;
  readonly releaseStatus: string;
  readonly studioReadyForRc4: boolean;
  readonly deployment: DeploymentReport;
  readonly configuration: ConfigurationReport;
  readonly health: HealthReport;
  readonly monitoring: MonitoringReport;
  readonly backup: BackupValidationReport;
  readonly upgrades: UpgradeReport;
  readonly diagnostics: DiagnosticsReport;
  readonly demo: DemoOrganizationSeed | null;
  readonly summary: string;
  readonly outstandingBlockers: readonly string[];
};

export type OperationsRunOptions = {
  readonly root?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly environment?: OpsEnvironment;
  readonly organizationId?: string;
  readonly seedDemo?: boolean;
  readonly registerWithStudio?: boolean;
};
