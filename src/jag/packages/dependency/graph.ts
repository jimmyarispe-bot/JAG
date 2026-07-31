import type {
  PackageDependency,
  PackageRecord,
} from "@/jag/packages/contracts/definitions";
import {
  satisfiesMaxVersion,
  satisfiesMinVersion,
} from "@/jag/packages/manifest";

export type DependencyValidationIssue = {
  readonly code: string;
  readonly message: string;
  readonly packageId: string;
  readonly dependencyId?: string;
};

/**
 * Validate dependency graph for a candidate against currently installed records.
 * Rejects missing required deps, version mismatches, and incompatible pairs.
 */
export function validatePackageDependencyGraph(input: {
  candidateId: string;
  dependencies: readonly PackageDependency[];
  installed: readonly PackageRecord[];
}): DependencyValidationIssue[] {
  const issues: DependencyValidationIssue[] = [];
  const byId = new Map(input.installed.map((r) => [r.manifest.metadata.id, r]));

  for (const dep of input.dependencies) {
    const target = byId.get(dep.packageId);

    if (dep.incompatible) {
      if (
        target &&
        target.state !== "removed" &&
        target.state !== "deactivated"
      ) {
        issues.push({
          code: "incompatible",
          packageId: input.candidateId,
          dependencyId: dep.packageId,
          message: `Package "${input.candidateId}" is incompatible with installed "${dep.packageId}"`,
        });
      }
      continue;
    }

    if (!target || target.state === "removed") {
      if (!dep.optional) {
        issues.push({
          code: "missing",
          packageId: input.candidateId,
          dependencyId: dep.packageId,
          message: `Required package "${dep.packageId}" is not installed`,
        });
      }
      continue;
    }

    if (!satisfiesMinVersion(target.version, dep.minVersion)) {
      issues.push({
        code: "min_version",
        packageId: input.candidateId,
        dependencyId: dep.packageId,
        message: `Package "${dep.packageId}" ${target.version.raw} is below minVersion ${dep.minVersion}`,
      });
    }
    if (!satisfiesMaxVersion(target.version, dep.maxVersion)) {
      issues.push({
        code: "max_version",
        packageId: input.candidateId,
        dependencyId: dep.packageId,
        message: `Package "${dep.packageId}" ${target.version.raw} is above maxVersion ${dep.maxVersion}`,
      });
    }
  }

  // Reverse incompatible: installed packages that mark candidate as incompatible
  for (const record of input.installed) {
    if (record.state === "removed" || record.state === "deactivated") continue;
    for (const dep of record.manifest.dependencies ?? []) {
      if (dep.incompatible && dep.packageId === input.candidateId) {
        issues.push({
          code: "incompatible_reverse",
          packageId: input.candidateId,
          dependencyId: record.manifest.metadata.id,
          message: `Installed package "${record.manifest.metadata.id}" is incompatible with "${input.candidateId}"`,
        });
      }
    }
  }

  return issues;
}
