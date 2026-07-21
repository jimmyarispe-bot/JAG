/**
 * Platform connector registry — discovery, registration, versioning,
 * lifecycle hooks, dependency validation, and health reporting.
 */

import type { PlatformConnector } from "@/lib/platform/integrations/contracts";
import type {
  ConnectorMetadata,
  HealthSnapshot,
} from "@/lib/platform/integrations/types";
import { assertPlatformConnector } from "@/lib/platform/integrations/core/connector";
import { LifecycleManager } from "@/lib/platform/integrations/core/lifecycle";

export type PlatformRegistryErrorCode =
  | "DUPLICATE_CONNECTOR"
  | "UNKNOWN_CONNECTOR"
  | "INVALID_CONNECTOR"
  | "INVALID_VERSION"
  | "CONNECTOR_DISABLED"
  | "DEPENDENCY_MISSING";

export class PlatformRegistryError extends Error {
  readonly code: PlatformRegistryErrorCode;
  readonly connectorId: string | null;

  constructor(options: {
    code: PlatformRegistryErrorCode;
    message: string;
    connectorId?: string | null;
  }) {
    super(options.message);
    this.name = "PlatformRegistryError";
    this.code = options.code;
    this.connectorId = options.connectorId ?? null;
  }
}

export type PlatformRegistryEntry = {
  connector: PlatformConnector;
  catalogEnabled: boolean;
  registeredAt: string;
  version: string;
  dependencies: readonly string[];
};

export type RegisterPlatformConnectorOptions = {
  replace?: boolean;
  catalogEnabled?: boolean;
  dependencies?: readonly string[];
};

const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export class PlatformConnectorRegistry {
  private readonly entries = new Map<string, PlatformRegistryEntry>();
  readonly lifecycle: LifecycleManager;

  constructor(
    private readonly now: () => Date = () => new Date(),
    lifecycle?: LifecycleManager
  ) {
    this.lifecycle = lifecycle ?? new LifecycleManager(now);
  }

  register(
    connector: PlatformConnector,
    options: RegisterPlatformConnectorOptions = {}
  ): void {
    assertPlatformConnector(connector);
    if (!SEMVER_PATTERN.test(connector.version)) {
      throw new PlatformRegistryError({
        code: "INVALID_VERSION",
        message: `Connector "${connector.id}" has invalid version "${connector.version}"`,
        connectorId: connector.id,
      });
    }

    const existing = this.entries.get(connector.id);
    if (existing && !options.replace) {
      throw new PlatformRegistryError({
        code: "DUPLICATE_CONNECTOR",
        message: `Connector "${connector.id}" is already registered (version ${existing.version})`,
        connectorId: connector.id,
      });
    }

    const dependencies = options.dependencies ?? [];
    for (const dep of dependencies) {
      if (!this.entries.has(dep)) {
        throw new PlatformRegistryError({
          code: "DEPENDENCY_MISSING",
          message: `Connector "${connector.id}" depends on missing connector "${dep}"`,
          connectorId: connector.id,
        });
      }
    }

    this.entries.set(connector.id, {
      connector,
      catalogEnabled: options.catalogEnabled ?? existing?.catalogEnabled ?? true,
      registeredAt: existing?.registeredAt ?? this.now().toISOString(),
      version: connector.version,
      dependencies,
    });
  }

  unregister(connectorId: string): boolean {
    return this.entries.delete(connectorId);
  }

  get(connectorId: string): PlatformConnector | null {
    return this.entries.get(connectorId)?.connector ?? null;
  }

  require(connectorId: string): PlatformConnector {
    const connector = this.get(connectorId);
    if (!connector) {
      throw new PlatformRegistryError({
        code: "UNKNOWN_CONNECTOR",
        message: `Unknown connector: ${connectorId}`,
        connectorId,
      });
    }
    return connector;
  }

  requireEnabled(connectorId: string): PlatformConnector {
    const entry = this.entries.get(connectorId);
    if (!entry) {
      throw new PlatformRegistryError({
        code: "UNKNOWN_CONNECTOR",
        message: `Unknown connector: ${connectorId}`,
        connectorId,
      });
    }
    if (!entry.catalogEnabled) {
      throw new PlatformRegistryError({
        code: "CONNECTOR_DISABLED",
        message: `Connector "${connectorId}" is disabled`,
        connectorId,
      });
    }
    return entry.connector;
  }

  has(connectorId: string): boolean {
    return this.entries.has(connectorId);
  }

  enable(connectorId: string): void {
    const entry = this.entries.get(connectorId);
    if (!entry) {
      throw new PlatformRegistryError({
        code: "UNKNOWN_CONNECTOR",
        message: `Unknown connector: ${connectorId}`,
        connectorId,
      });
    }
    entry.catalogEnabled = true;
  }

  disable(connectorId: string): void {
    const entry = this.entries.get(connectorId);
    if (!entry) {
      throw new PlatformRegistryError({
        code: "UNKNOWN_CONNECTOR",
        message: `Unknown connector: ${connectorId}`,
        connectorId,
      });
    }
    entry.catalogEnabled = false;
  }

  isEnabled(connectorId: string): boolean {
    return this.entries.get(connectorId)?.catalogEnabled ?? false;
  }

  getVersion(connectorId: string): string | null {
    return this.entries.get(connectorId)?.version ?? null;
  }

  list(options: { enabledOnly?: boolean } = {}): ConnectorMetadata[] {
    return [...this.entries.values()]
      .filter((entry) => (options.enabledOnly ? entry.catalogEnabled : true))
      .map((entry) => entry.connector.metadata());
  }

  discover(): readonly PlatformRegistryEntry[] {
    return [...this.entries.values()];
  }

  validateDependencies(): { ok: boolean; issues: string[] } {
    const issues: string[] = [];
    for (const entry of this.entries.values()) {
      for (const dep of entry.dependencies) {
        if (!this.entries.has(dep)) {
          issues.push(`${entry.connector.id} missing dependency ${dep}`);
        } else if (!this.entries.get(dep)!.catalogEnabled) {
          issues.push(`${entry.connector.id} depends on disabled ${dep}`);
        }
      }
    }
    return { ok: issues.length === 0, issues };
  }

  async healthReport(): Promise<HealthSnapshot[]> {
    const reports: HealthSnapshot[] = [];
    for (const entry of this.entries.values()) {
      if (!entry.catalogEnabled) continue;
      const instanceId = `${entry.connector.id}-catalog`;
      reports.push(await entry.connector.health(instanceId));
    }
    return reports;
  }

  size(): number {
    return this.entries.size;
  }
}

export function createPlatformConnectorRegistry(
  now?: () => Date
): PlatformConnectorRegistry {
  return new PlatformConnectorRegistry(now);
}
