/**
 * Marketplace dependency resolution (topological order).
 */

import { satisfiesVersionRange } from "@/jag/capability-packs";
import type {
  MarketplaceResolveResult,
  MarketplaceValidationIssue,
} from "@/jag/marketplace/contracts";
import type { LocalMarketplaceRegistry } from "@/jag/marketplace/registry/local-registry";

function issue(
  path: string,
  code: string,
  message: string
): MarketplaceValidationIssue {
  return { path, code, message, severity: "error" };
}

/**
 * Resolve install order for `rootId` including transitive dependencies.
 * Optional dependencies that are missing are skipped (with warning via issues severity warning).
 */
export function resolveMarketplaceDependencies(
  registry: LocalMarketplaceRegistry,
  rootId: string
): MarketplaceResolveResult {
  const issues: MarketplaceValidationIssue[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      issues.push(
        issue("dependencies", "cycle", `Dependency cycle detected at "${id}"`)
      );
      return;
    }
    const artifact = registry.get(id);
    if (!artifact) {
      issues.push(
        issue("dependencies", "missing", `Artifact "${id}" is not in the registry`)
      );
      return;
    }

    visiting.add(id);
    for (const dep of artifact.manifest.dependencies) {
      const depArtifact = registry.get(dep.id);
      if (!depArtifact) {
        if (dep.optional) {
          issues.push({
            path: `dependencies.${dep.id}`,
            code: "optional_missing",
            message: `Optional dependency "${dep.id}" is not in the registry`,
            severity: "warning",
          });
          continue;
        }
        issues.push(
          issue(
            `dependencies.${dep.id}`,
            "missing",
            `Required dependency "${dep.id}" is not in the registry`
          )
        );
        continue;
      }
      if (
        !satisfiesVersionRange(depArtifact.manifest.version, dep.versionRange)
      ) {
        issues.push(
          issue(
            `dependencies.${dep.id}`,
            "version",
            `Dependency "${dep.id}"@${depArtifact.manifest.version} does not satisfy ${dep.versionRange}`
          )
        );
        continue;
      }
      visit(dep.id);
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }

  visit(rootId);

  const hardErrors = issues.filter((i) => i.severity !== "warning");
  return {
    ok: hardErrors.length === 0 && order.includes(rootId),
    order: Object.freeze(order),
    issues: Object.freeze(issues),
  };
}
