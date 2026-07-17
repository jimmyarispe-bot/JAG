/**
 * Sprint 020 — Connector Registry (platform infrastructure).
 *
 * Single source of truth for connector catalog registration, catalog-level
 * enable/disable, and version. Reusable by all products — no product-specific logic.
 */

import type { Connector } from "@/lib/platform/integrations/common/contracts";
import type {
  ConnectorCategory,
  ConnectorMetadata,
} from "@/lib/platform/integrations/common/types";

export type ConnectorRegistryErrorCode =
  | "DUPLICATE_CONNECTOR"
  | "UNKNOWN_CONNECTOR"
  | "INVALID_CONNECTOR"
  | "INVALID_VERSION"
  | "CONNECTOR_DISABLED";

export class ConnectorRegistryError extends Error {
  readonly code: ConnectorRegistryErrorCode;
  readonly connectorId: string | null;

  constructor(options: {
    code: ConnectorRegistryErrorCode;
    message: string;
    connectorId?: string | null;
  }) {
    super(options.message);
    this.name = "ConnectorRegistryError";
    this.code = options.code;
    this.connectorId = options.connectorId ?? null;
  }
}

export type ConnectorRegistryEntry = {
  connector: Connector;
  /** Catalog-level availability (distinct from per-instance enabled). */
  catalogEnabled: boolean;
  registeredAt: string;
  version: string;
};

export type RegisterConnectorOptions = {
  /** Replace an existing connector id (version upgrade / test re-register). */
  replace?: boolean;
  /** Initial catalog enabled flag (default true). */
  catalogEnabled?: boolean;
};

export type ListCatalogOptions = {
  enabledOnly?: boolean;
  placeholder?: boolean;
  category?: ConnectorCategory;
};

/** Semver-ish: MAJOR.MINOR.PATCH with optional pre-release/build. */
const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export type ConnectorRegistryDependencies = {
  now?: () => Date;
};

/**
 * In-memory connector registry — instance-scoped for DI and test isolation.
 */
export class ConnectorRegistry {
  private readonly entries = new Map<string, ConnectorRegistryEntry>();
  private readonly now: () => Date;

  constructor(dependencies: ConnectorRegistryDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  register(connector: Connector, options: RegisterConnectorOptions = {}): void {
    assertConnector(connector);
    const id = connector.metadata.id;
    const existing = this.entries.get(id);

    if (existing && !options.replace) {
      throw new ConnectorRegistryError({
        code: "DUPLICATE_CONNECTOR",
        message: `Connector "${id}" is already registered (version ${existing.version})`,
        connectorId: id,
      });
    }

    this.entries.set(id, {
      connector,
      catalogEnabled: options.catalogEnabled ?? existing?.catalogEnabled ?? true,
      registeredAt: existing?.registeredAt ?? this.now().toISOString(),
      version: connector.metadata.version,
    });
  }

  unregister(connectorId: string): boolean {
    return this.entries.delete(connectorId);
  }

  clear(): void {
    this.entries.clear();
  }

  get(connectorId: string): Connector | null {
    return this.entries.get(connectorId)?.connector ?? null;
  }

  getEntry(connectorId: string): ConnectorRegistryEntry | null {
    return this.entries.get(connectorId) ?? null;
  }

  has(connectorId: string): boolean {
    return this.entries.has(connectorId);
  }

  getVersion(connectorId: string): string | null {
    return this.entries.get(connectorId)?.version ?? null;
  }

  isEnabled(connectorId: string): boolean {
    const entry = this.entries.get(connectorId);
    if (!entry) {
      throw new ConnectorRegistryError({
        code: "UNKNOWN_CONNECTOR",
        message: `Unknown connector: ${connectorId}`,
        connectorId,
      });
    }
    return entry.catalogEnabled;
  }

  enable(connectorId: string): void {
    const entry = this.requireEntry(connectorId);
    this.entries.set(connectorId, { ...entry, catalogEnabled: true });
  }

  disable(connectorId: string): void {
    const entry = this.requireEntry(connectorId);
    this.entries.set(connectorId, { ...entry, catalogEnabled: false });
  }

  /**
   * Resolve a connector for runtime use. Throws if unknown or catalog-disabled.
   */
  requireEnabled(connectorId: string): Connector {
    const entry = this.requireEntry(connectorId);
    if (!entry.catalogEnabled) {
      throw new ConnectorRegistryError({
        code: "CONNECTOR_DISABLED",
        message: `Connector "${connectorId}" is disabled in the catalog`,
        connectorId,
      });
    }
    return entry.connector;
  }

  list(options: ListCatalogOptions = {}): ConnectorMetadata[] {
    return this.listEntries(options).map((e) => e.connector.metadata);
  }

  listEntries(options: ListCatalogOptions = {}): ConnectorRegistryEntry[] {
    let entries = [...this.entries.values()];
    if (options.enabledOnly) {
      entries = entries.filter((e) => e.catalogEnabled);
    }
    if (options.placeholder !== undefined) {
      entries = entries.filter(
        (e) => e.connector.metadata.placeholder === options.placeholder
      );
    }
    if (options.category) {
      entries = entries.filter(
        (e) => e.connector.metadata.category === options.category
      );
    }
    return entries;
  }

  size(): number {
    return this.entries.size;
  }

  private requireEntry(connectorId: string): ConnectorRegistryEntry {
    const entry = this.entries.get(connectorId);
    if (!entry) {
      throw new ConnectorRegistryError({
        code: "UNKNOWN_CONNECTOR",
        message: `Unknown connector: ${connectorId}`,
        connectorId,
      });
    }
    return entry;
  }
}

export function createConnectorRegistry(
  dependencies: ConnectorRegistryDependencies = {}
): ConnectorRegistry {
  return new ConnectorRegistry(dependencies);
}

function assertConnector(connector: Connector): void {
  if (!connector || typeof connector !== "object") {
    throw new ConnectorRegistryError({
      code: "INVALID_CONNECTOR",
      message: "Connector candidate must be a non-null object",
    });
  }
  const meta = connector.metadata;
  if (!meta || typeof meta !== "object") {
    throw new ConnectorRegistryError({
      code: "INVALID_CONNECTOR",
      message: "Connector must declare metadata",
    });
  }
  if (!meta.id || typeof meta.id !== "string") {
    throw new ConnectorRegistryError({
      code: "INVALID_CONNECTOR",
      message: "Connector metadata.id must be a non-empty string",
      connectorId: meta?.id ? String(meta.id) : null,
    });
  }
  if (!meta.name || typeof meta.name !== "string") {
    throw new ConnectorRegistryError({
      code: "INVALID_CONNECTOR",
      message: `Connector "${meta.id}" must declare metadata.name`,
      connectorId: meta.id,
    });
  }
  if (!meta.version || typeof meta.version !== "string") {
    throw new ConnectorRegistryError({
      code: "INVALID_VERSION",
      message: `Connector "${meta.id}" must declare metadata.version`,
      connectorId: meta.id,
    });
  }
  if (!SEMVER_PATTERN.test(meta.version)) {
    throw new ConnectorRegistryError({
      code: "INVALID_VERSION",
      message: `Connector "${meta.id}" version "${meta.version}" must be semver (e.g. 1.0.0)`,
      connectorId: meta.id,
    });
  }
  if (typeof connector.connect !== "function" || typeof connector.sync !== "function") {
    throw new ConnectorRegistryError({
      code: "INVALID_CONNECTOR",
      message: `Connector "${meta.id}" must implement the Connector contract`,
      connectorId: meta.id,
    });
  }
}
