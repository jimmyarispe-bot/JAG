/**
 * Validate a Capability Pack manifest + dependency graph.
 */

import type { CapabilityPack } from "@/jag/blueprints/contracts";
import type {
  CapabilityPackValidationIssue,
  CapabilityPackValidationResult,
} from "@/jag/capability-packs/contracts";
import {
  packProvidesModules,
  satisfiesVersionRange,
} from "@/jag/capability-packs/versioning";

function issue(
  path: string,
  code: string,
  message: string,
  severity: "error" | "warning" = "error"
): CapabilityPackValidationIssue {
  return { path, code, message, severity };
}

export function validateCapabilityPack(
  pack: CapabilityPack
): CapabilityPackValidationResult {
  const issues: CapabilityPackValidationIssue[] = [];

  if (!pack.id?.trim()) {
    issues.push(issue("id", "required", "Pack id is required"));
  }
  if (!pack.label?.trim() && !pack.name?.trim()) {
    issues.push(issue("label", "required", "Pack label or name is required"));
  }
  if (!pack.version?.trim()) {
    issues.push(issue("version", "required", "Pack version is required"));
  }

  const status = pack.status ?? "published";
  if (status === "published" && !pack.license) {
    issues.push(
      issue(
        "license",
        "license_required",
        "Published packs should declare a license",
        "warning"
      )
    );
  }
  if (status === "deprecated" && !pack.deprecated) {
    issues.push(
      issue(
        "deprecated",
        "deprecation_metadata_required",
        "Deprecated packs must include deprecated metadata"
      )
    );
  }
  if (status === "retired" && pack.deprecated?.successorPackId) {
    // fine — successor guidance
  }

  for (const dep of pack.dependencies ?? []) {
    if (!dep.packId?.trim()) {
      issues.push(
        issue("dependencies", "invalid_dependency", "Dependency packId required")
      );
    }
    if (!dep.versionRange?.trim()) {
      issues.push(
        issue(
          `dependencies.${dep.packId}`,
          "invalid_dependency",
          "Dependency versionRange required"
        )
      );
    }
  }

  if (status === "retired") {
    issues.push(
      issue(
        "status",
        "retired_pack",
        "Retired packs must not be newly enabled",
        "warning"
      )
    );
  }

  if (!packProvidesModules(pack).length) {
    issues.push(
      issue(
        "modules",
        "no_modules",
        "Pack declares no modules (providesModules / modules)",
        "warning"
      )
    );
  }

  return {
    ok: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}

export function validateCapabilityPackSet(
  packs: readonly CapabilityPack[]
): CapabilityPackValidationResult {
  const issues: CapabilityPackValidationIssue[] = [];
  const byId = new Map<string, CapabilityPack>();

  for (const pack of packs) {
    const single = validateCapabilityPack(pack);
    issues.push(...single.issues);
    if (byId.has(pack.id)) {
      issues.push(
        issue(
          "packs",
          "duplicate_pack",
          `Duplicate capability pack id "${pack.id}"`
        )
      );
    }
    byId.set(pack.id, pack);
  }

  for (const pack of packs) {
    for (const dep of pack.dependencies ?? []) {
      const target = byId.get(dep.packId);
      if (!target) {
        if (!dep.optional) {
          issues.push(
            issue(
              `dependencies.${pack.id}`,
              "missing_dependency",
              `Pack "${pack.id}" depends on missing "${dep.packId}"`
            )
          );
        }
        continue;
      }
      const version = target.version ?? "0.0.0";
      if (!satisfiesVersionRange(version, dep.versionRange)) {
        issues.push(
          issue(
            `dependencies.${pack.id}`,
            "dependency_version_mismatch",
            `Pack "${pack.id}" requires "${dep.packId}" ${dep.versionRange}, found ${version}`
          )
        );
      }
    }
  }

  // Circular dependency detection (simple DFS).
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      issues.push(
        issue(
          "dependencies",
          "circular_dependency",
          `Circular dependency involving ${[...stack, id].join(" → ")}`
        )
      );
      return;
    }
    visiting.add(id);
    stack.push(id);
    const pack = byId.get(id);
    for (const dep of pack?.dependencies ?? []) {
      if (byId.has(dep.packId)) visit(dep.packId);
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of byId.keys()) visit(id);

  return {
    ok: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}
