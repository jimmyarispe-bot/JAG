/**
 * Operations Dashboard — unified RC-3 operational readiness surface.
 */

import { validateBackupRecovery } from "./backup";
import { validateConfiguration } from "./configuration";
import { seedDemoOrganization } from "./demo";
import { validateDeployment } from "./deployment";
import { runDiagnostics } from "./diagnostics";
import { buildHealthReport } from "./health";
import { collectMonitoringMetrics } from "./monitoring";
import { buildRc3StudioArtifacts } from "./release-artifacts";
import { getLastOperationsDashboard, setLastOperationsDashboard } from "./store";
import type {
  HealthStatus,
  OperationsDashboard,
  OperationsRunOptions,
} from "./types";
import { validateUpgrade } from "./upgrades";

function statusFromPassed(passed: boolean): HealthStatus {
  if (passed) return "Healthy";
  return "Critical";
}

export function buildOperationsDashboard(
  options: OperationsRunOptions = {}
): OperationsDashboard {
  const deployment = validateDeployment(options);
  const configuration = validateConfiguration(options);
  const health = buildHealthReport(options);
  const monitoring = collectMonitoringMetrics(options);
  const backup = validateBackupRecovery(options);
  const upgrades = validateUpgrade(options);
  const diagnostics = runDiagnostics(options, {
    deployment,
    configuration,
    health,
    upgrades,
    backup,
  });
  const demo =
    options.seedDemo === false
      ? null
      : seedDemoOrganization({
          ...options,
        });

  const outstandingBlockers = [
    ...deployment.checks
      .filter((c) => !c.ok && (c.severity === "critical" || c.severity === "error"))
      .map((c) => c.detail),
    ...configuration.missing.map((m) => `Missing config: ${m}`),
    ...configuration.invalid.map((m) => `Invalid config: ${m}`),
    ...upgrades.checklist.filter((c) => !c.ok).map((c) => c.detail),
    ...(backup.passed ? [] : [backup.summary]),
    ...(health.status === "Critical" ? [health.summary] : []),
  ];

  const connectorCat = health.categories.find(
    (c) => c.category === "Connectors"
  );

  const dashboard: OperationsDashboard = {
    generatedAt: new Date().toISOString(),
    environment: deployment.environment,
    deploymentStatus: statusFromPassed(deployment.passed),
    configurationStatus: statusFromPassed(configuration.passed),
    healthStatus: health.status,
    diagnosticsStatus: diagnostics.status,
    upgradeReadiness: statusFromPassed(upgrades.passed),
    backupValidation: statusFromPassed(backup.passed),
    connectorStatus: connectorCat?.status ?? "Warning",
    releaseStatus: "RC-3",
    studioReadyForRc4: false,
    deployment,
    configuration,
    health,
    monitoring,
    backup,
    upgrades,
    diagnostics,
    demo,
    summary:
      outstandingBlockers.length === 0
        ? "AcademyOS RC-3 operations dashboard healthy (awaiting Studio evaluation)"
        : `AcademyOS RC-3 operations have ${outstandingBlockers.length} blocker(s)`,
    outstandingBlockers: Object.freeze(outstandingBlockers),
  };

  void buildRc3StudioArtifacts(dashboard);
  return setLastOperationsDashboard(dashboard);
}

export function getOperationsDashboard(): OperationsDashboard | null {
  return getLastOperationsDashboard();
}

export function createOperationsService() {
  return {
    build: buildOperationsDashboard,
    get: getOperationsDashboard,
    deployment: validateDeployment,
    configuration: validateConfiguration,
    health: buildHealthReport,
    monitoring: collectMonitoringMetrics,
    backup: validateBackupRecovery,
    upgrades: validateUpgrade,
    diagnostics: runDiagnostics,
    seedDemo: seedDemoOrganization,
    studioArtifacts: (dash?: OperationsDashboard) =>
      buildRc3StudioArtifacts(dash ?? buildOperationsDashboard()),
  };
}
