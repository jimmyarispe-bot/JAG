/**
 * Marketplace Installer — validates compatibility, resolves deps, records install.
 * Does not modify Platform engines, Runtime Generation, Compiler, or Lifecycle.
 */

import type {
  MarketplaceInstallRecord,
  MarketplaceInstallResult,
  MarketplaceValidationIssue,
} from "@/jag/marketplace/contracts";
import { resolveMarketplaceDependencies } from "@/jag/marketplace/dependency/resolve";
import type { LocalMarketplaceRegistry } from "@/jag/marketplace/registry/local-registry";
import { getDefaultMarketplaceRegistry } from "@/jag/marketplace/registry/local-registry";
import { validateMarketplaceArtifactWithSdk } from "@/jag/marketplace/validation/artifact-sdk";

export type MarketplaceInstallerOptions = {
  readonly registry?: LocalMarketplaceRegistry;
  /** When true, do not mutate the install store (plan only). */
  readonly dryRun?: boolean;
};

export class MarketplaceInstaller {
  private readonly registry: LocalMarketplaceRegistry;
  private readonly installed = new Map<string, MarketplaceInstallRecord>();

  constructor(options: MarketplaceInstallerOptions = {}) {
    this.registry = options.registry ?? getDefaultMarketplaceRegistry();
  }

  listInstalled(): readonly MarketplaceInstallRecord[] {
    return Object.freeze(
      [...this.installed.values()].sort((a, b) => a.id.localeCompare(b.id))
    );
  }

  isInstalled(id: string): boolean {
    return this.installed.has(id);
  }

  getInstalled(id: string): MarketplaceInstallRecord | undefined {
    return this.installed.get(id);
  }

  clearInstalled(): void {
    this.installed.clear();
  }

  /**
   * Install an artifact by id after compatibility + dependency validation.
   */
  install(
    id: string,
    options: { readonly dryRun?: boolean } = {}
  ): MarketplaceInstallResult {
    const dryRun = options.dryRun ?? false;
    const issues: MarketplaceValidationIssue[] = [];

    const root = this.registry.get(id);
    if (!root) {
      return {
        ok: false,
        issues: [
          {
            path: "id",
            code: "not_found",
            message: `Artifact "${id}" is not in the marketplace registry`,
            severity: "error",
          },
        ],
      };
    }

    const resolved = resolveMarketplaceDependencies(this.registry, id);
    issues.push(...resolved.issues);
    if (!resolved.ok) {
      return { ok: false, plan: resolved.order, issues };
    }

    for (const depId of resolved.order) {
      const artifact = this.registry.get(depId);
      if (!artifact) continue;
      const validation = validateMarketplaceArtifactWithSdk(artifact);
      for (const i of validation.issues) {
        issues.push({
          ...i,
          path: `${depId}:${i.path}`,
        });
      }
    }

    const hardErrors = issues.filter((i) => i.severity !== "warning");
    if (hardErrors.length > 0) {
      return { ok: false, plan: resolved.order, issues };
    }

    const records: MarketplaceInstallRecord[] = [];
    const now = new Date().toISOString();
    for (const depId of resolved.order) {
      const artifact = this.registry.get(depId)!;
      const record: MarketplaceInstallRecord = Object.freeze({
        id: artifact.manifest.id,
        version: artifact.manifest.version,
        kind: artifact.manifest.kind,
        installedAt: now,
        checksum: artifact.manifest.checksum,
        resolvedDependencies: Object.freeze(
          artifact.manifest.dependencies.map((d) => d.id)
        ),
      });
      records.push(record);
      if (!dryRun) {
        this.installed.set(depId, record);
      }
    }

    return {
      ok: true,
      plan: resolved.order,
      installed: Object.freeze(records),
      issues: Object.freeze(issues),
    };
  }
}

let defaultInstaller: MarketplaceInstaller | undefined;

export function getDefaultMarketplaceInstaller(): MarketplaceInstaller {
  if (!defaultInstaller) {
    defaultInstaller = new MarketplaceInstaller();
  }
  return defaultInstaller;
}

export function resetDefaultMarketplaceInstallerForTests(): void {
  defaultInstaller = undefined;
}

export function installMarketplaceArtifact(
  id: string,
  options: MarketplaceInstallerOptions & { readonly dryRun?: boolean } = {}
): MarketplaceInstallResult {
  const installer = options.registry
    ? new MarketplaceInstaller({ registry: options.registry })
    : getDefaultMarketplaceInstaller();
  return installer.install(id, { dryRun: options.dryRun });
}
