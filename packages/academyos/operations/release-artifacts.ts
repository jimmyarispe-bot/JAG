/**
 * RC-3 release artifact descriptor — data only for Studio consumption.
 * AcademyOS must not import JAG Studio (architecture rule).
 */

import type { OperationsDashboard } from "./types";

export type AcademyOsRc3StudioArtifacts = {
  readonly productId: "academyos";
  readonly version: "1.0.0-rc.3";
  readonly status: "RC-3";
  readonly releaseNotes: string;
  readonly migrationHistory: readonly string[];
  readonly upgradePath: readonly string[];
  readonly compatibilityMatrix: Readonly<Record<string, string>>;
  readonly opsSummary: string;
  readonly deploymentPassed: boolean;
  readonly configurationPassed: boolean;
  readonly healthStatus: string;
  readonly backupPassed: boolean;
  readonly upgradesPassed: boolean;
  readonly outstandingBlockers: readonly string[];
};

export function buildRc3StudioArtifacts(
  dashboard: OperationsDashboard
): AcademyOsRc3StudioArtifacts {
  return {
    productId: "academyos",
    version: "1.0.0-rc.3",
    status: "RC-3",
    releaseNotes:
      "AcademyOS RC-3 — deployment, configuration, health, monitoring, backup/recovery, upgrades, diagnostics, and demo organization. Studio remains release authority.",
    migrationHistory: Object.freeze([
      "RC-1 Validation",
      "RC-2 Hardening",
      "RC-3 Operations",
    ]),
    upgradePath: Object.freeze(["RC-3", "RC-4", "Certified", "Released"]),
    compatibilityMatrix: Object.freeze({
      platform: "1.x",
      sdk: "1.x",
      twin: "1.x",
    }),
    opsSummary: dashboard.summary,
    deploymentPassed: dashboard.deployment.passed,
    configurationPassed: dashboard.configuration.passed,
    healthStatus: dashboard.health.status,
    backupPassed: dashboard.backup.passed,
    upgradesPassed: dashboard.upgrades.passed,
    outstandingBlockers: dashboard.outstandingBlockers,
  };
}
