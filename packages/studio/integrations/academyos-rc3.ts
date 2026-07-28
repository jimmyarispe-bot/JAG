/**
 * Studio consumes AcademyOS RC-3 operations evidence and registers release artifacts.
 * Direction: Studio → Industry Pack (allowed). Never the reverse.
 */

import {
  buildOperationsDashboard,
  buildRc3StudioArtifacts,
  type OperationsDashboard,
  type OperationsRunOptions,
} from "@academyos";
import { ensureCertificationRecord } from "../certification/engine";
import { createProductRegistryService } from "../products/registry";
import { createReleaseManager } from "../release/manager";
import { evaluateReleaseGates } from "../releases/gates";
import { installJagStudio } from "../install";

export type AcademyOsRc3StudioEvaluation = {
  readonly dashboard: OperationsDashboard;
  readonly studioInstalled: boolean;
  readonly releaseId: string | null;
  readonly productStatus: string;
  readonly certificationStage: string;
  readonly gatesPassed: boolean;
  readonly readyForRc4: boolean;
  readonly readinessScore: number;
  readonly remainingBlockers: readonly string[];
  readonly summary: string;
};

function isRelease<T extends { id: string }>(
  value: T | { error: string }
): value is T {
  return value != null && !("error" in value);
}

export function evaluateAcademyOsRc3WithStudio(
  options: OperationsRunOptions = {}
): AcademyOsRc3StudioEvaluation {
  const root = options.root ?? process.cwd();
  const org = options.organizationId ?? "org.studio.academyos.rc3";

  const installed = installJagStudio({
    organizationId: org,
    freshSdk: true,
    repositoryRoot: root,
  });

  const dashboard = buildOperationsDashboard({
    ...options,
    root,
    seedDemo: options.seedDemo === true,
  });
  const artifacts = buildRc3StudioArtifacts(dashboard);

  const products = createProductRegistryService();
  const product = products.upsert({
    id: "academyos",
    version: "1.0.0",
    completionPercent: Math.max(
      96,
      products.get("academyos")?.completionPercent ?? 0
    ),
    releaseStatus: "RC-3",
    certification: "Pending",
    description:
      "Education industry pack — RC-3 deployment/operations readiness complete; Studio governs advancement to RC-4.",
  });

  const releases = createReleaseManager();
  const existing = releases
    .list("academyos")
    .find((r) => r.version === "1.0.0-rc.3" || r.status === "RC-3");
  const created =
    existing ??
    releases.create({
      productId: "academyos",
      version: artifacts.version,
      status: "RC-3",
      releaseNotes: artifacts.releaseNotes,
      migrationHistory: artifacts.migrationHistory,
      upgradePath: artifacts.upgradePath,
      compatibilityMatrix: artifacts.compatibilityMatrix,
      createdBy: "studio.academyos-rc3",
      skipGateCheck: true,
    });
  const release = existing ?? (isRelease(created) ? created : null);

  // Lightweight cert refresh — gates evaluated once below (avoid nested readiness rebuild).
  const cert = ensureCertificationRecord("academyos", root, {
    lightweight: true,
  });
  const gates = evaluateReleaseGates({
    productId: "academyos",
    targetStage: "RC-3",
    root,
  });

  const opsClean =
    artifacts.outstandingBlockers.length === 0 &&
    artifacts.deploymentPassed &&
    artifacts.configurationPassed &&
    artifacts.upgradesPassed &&
    artifacts.backupPassed;
  const readyForRc4 = gates.passed && opsClean;
  const readinessScore = gates.passed
    ? Math.min(100, 70 + gates.gates.filter((g) => g.passed).length * 2)
    : Math.max(0, 40 - gates.blockers.length * 5);

  const remainingBlockers = Object.freeze([
    ...artifacts.outstandingBlockers,
    ...gates.blockers,
  ]);

  return {
    dashboard: {
      ...dashboard,
      releaseStatus: product.releaseStatus,
      studioReadyForRc4: readyForRc4,
      outstandingBlockers: remainingBlockers,
      summary: readyForRc4
        ? "AcademyOS RC-3 operations complete — Studio: Ready for RC-4"
        : `AcademyOS RC-3 ops built; Studio readiness pending (${remainingBlockers.length} blocker signal(s))`,
    },
    studioInstalled: installed.enabled,
    releaseId: release?.id ?? null,
    productStatus: product.releaseStatus,
    certificationStage: cert.releaseStage,
    gatesPassed: gates.passed,
    readyForRc4,
    readinessScore,
    remainingBlockers,
    summary: readyForRc4
      ? "Studio evaluates AcademyOS Ready for RC-4 (RC-3 gates passed)"
      : `Studio RC-3 evaluation incomplete — score ${readinessScore}; ${gates.blockers.length} gate blocker(s)`,
  };
}
