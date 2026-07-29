/**
 * Domain Registry — tracks installed domain packages.
 * No automatic loading; host explicitly registers packs.
 */

import type { DomainPackage } from "./domain-builder";
import type { DomainManifest } from "./domain-manifest";
import {
  validateDomainManifest,
  type DomainValidationResult,
} from "./domain-validation";

export type DomainRegistryStatus = "registered" | "enabled" | "disabled";

export interface DomainRegistryEntry {
  domain: DomainPackage;
  status: DomainRegistryStatus;
  registeredAt: string;
  enabledAt?: string;
  disabledAt?: string;
}

export interface DomainRegistryOptions {
  runtimeVersion?: string;
  coreVersion?: string;
  sdkVersion?: string;
  now?: () => string;
  /** Validate on register (default true). */
  validateOnRegister?: boolean;
}

export interface DomainRegistry {
  register(domain: DomainPackage): DomainRegistryEntry;
  unregister(domainId: string): boolean;
  enable(domainId: string): DomainRegistryEntry;
  disable(domainId: string): DomainRegistryEntry;
  get(domainId: string): DomainRegistryEntry | undefined;
  list(filter?: { status?: DomainRegistryStatus }): DomainRegistryEntry[];
  validate(domainId?: string): DomainValidationResult | Map<string, DomainValidationResult>;
  has(domainId: string): boolean;
  clear(): void;
}

export function createDomainRegistry(
  options: DomainRegistryOptions = {}
): DomainRegistry {
  return new DomainRegistryImpl(options);
}

class DomainRegistryImpl implements DomainRegistry {
  private readonly entries = new Map<string, DomainRegistryEntry>();

  constructor(private readonly options: DomainRegistryOptions) {}

  register(domain: DomainPackage): DomainRegistryEntry {
    const id = domain.manifest.id;
    if (this.entries.has(id)) {
      throw new Error(`Domain already registered: ${id}`);
    }

    if (this.options.validateOnRegister !== false) {
      const result = this.validateManifest(domain.manifest, domain);
      if (!result.ok) {
        throw new Error(
          `Domain registration validation failed for ${id}: ${result.errors
            .map((e) => e.message)
            .join("; ")}`
        );
      }
    }

    const entry: DomainRegistryEntry = {
      domain,
      status: "registered",
      registeredAt: this.now(),
    };
    this.entries.set(id, entry);
    return { ...entry };
  }

  unregister(domainId: string): boolean {
    return this.entries.delete(domainId);
  }

  enable(domainId: string): DomainRegistryEntry {
    const entry = this.require(domainId);
    entry.status = "enabled";
    entry.enabledAt = this.now();
    entry.disabledAt = undefined;
    return { ...entry };
  }

  disable(domainId: string): DomainRegistryEntry {
    const entry = this.require(domainId);
    entry.status = "disabled";
    entry.disabledAt = this.now();
    return { ...entry };
  }

  get(domainId: string): DomainRegistryEntry | undefined {
    const entry = this.entries.get(domainId);
    return entry ? { ...entry } : undefined;
  }

  list(filter?: { status?: DomainRegistryStatus }): DomainRegistryEntry[] {
    const all = [...this.entries.values()].map((e) => ({ ...e }));
    if (!filter?.status) return all;
    return all.filter((e) => e.status === filter.status);
  }

  validate(
    domainId?: string
  ): DomainValidationResult | Map<string, DomainValidationResult> {
    if (domainId) {
      const entry = this.require(domainId);
      return this.validateManifest(entry.domain.manifest, entry.domain);
    }
    const map = new Map<string, DomainValidationResult>();
    for (const [id, entry] of this.entries) {
      map.set(id, this.validateManifest(entry.domain.manifest, entry.domain));
    }
    return map;
  }

  has(domainId: string): boolean {
    return this.entries.has(domainId);
  }

  clear(): void {
    this.entries.clear();
  }

  private require(domainId: string): DomainRegistryEntry {
    const entry = this.entries.get(domainId);
    if (!entry) throw new Error(`Domain not registered: ${domainId}`);
    return entry;
  }

  private validateManifest(
    manifest: DomainManifest,
    domain: DomainPackage
  ): DomainValidationResult {
    const host =
      this.options.runtimeVersion && this.options.coreVersion
        ? {
            runtimeVersion: this.options.runtimeVersion,
            coreVersion: this.options.coreVersion,
            sdkVersion: this.options.sdkVersion,
          }
        : undefined;
    return validateDomainManifest(manifest, {
      bundle: domain.bundle,
      host,
    });
  }

  private now(): string {
    return this.options.now?.() ?? new Date().toISOString();
  }
}
