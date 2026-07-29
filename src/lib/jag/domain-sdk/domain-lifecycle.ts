/**
 * Domain lifecycle — in-memory state machine.
 * No persistence; host owns durable install records.
 */

import type { DomainAdapterRegistrationApi } from "@/lib/jag/runtime";
import type { DomainPackage } from "./domain-builder";
import type { DomainValidationResult } from "./domain-validation";
import { validateDomainManifest } from "./domain-validation";

export const DOMAIN_LIFECYCLE_STATES = [
  "declared",
  "installed",
  "initialized",
  "active",
  "inactive",
  "upgrading",
  "removed",
] as const;

export type DomainLifecycleState = (typeof DOMAIN_LIFECYCLE_STATES)[number];

export interface DomainLifecycleRecord {
  domainId: string;
  state: DomainLifecycleState;
  package: DomainPackage;
  installedAt?: string;
  activatedAt?: string;
  deactivatedAt?: string;
  removedAt?: string;
  lastError?: string;
}

export interface DomainLifecycleHost {
  /** Host Runtime registration API (usually registry.asDomainAdapterApi()). */
  registrationApi: DomainAdapterRegistrationApi;
  runtimeVersion: string;
  coreVersion: string;
  sdkVersion?: string;
  now?: () => string;
}

export interface DomainLifecycleController {
  install(domain: DomainPackage): Promise<DomainLifecycleRecord>;
  initialize(domainId: string): Promise<DomainLifecycleRecord>;
  activate(domainId: string): Promise<DomainLifecycleRecord>;
  deactivate(domainId: string): Promise<DomainLifecycleRecord>;
  upgrade(domainId: string, next: DomainPackage): Promise<DomainLifecycleRecord>;
  remove(domainId: string): Promise<DomainLifecycleRecord>;
  get(domainId: string): DomainLifecycleRecord | undefined;
  list(): DomainLifecycleRecord[];
}

const ALLOWED: Record<
  DomainLifecycleState,
  readonly DomainLifecycleState[]
> = {
  declared: ["installed", "removed"],
  installed: ["initialized", "upgrading", "removed"],
  initialized: ["active", "inactive", "upgrading", "removed"],
  active: ["inactive", "upgrading", "removed"],
  inactive: ["active", "upgrading", "removed", "initialized"],
  upgrading: ["active", "inactive", "removed"],
  removed: [],
};

export function createDomainLifecycle(
  host: DomainLifecycleHost
): DomainLifecycleController {
  return new DomainLifecycleImpl(host);
}

class DomainLifecycleImpl implements DomainLifecycleController {
  private readonly records = new Map<string, DomainLifecycleRecord>();

  constructor(private readonly host: DomainLifecycleHost) {}

  async install(domain: DomainPackage): Promise<DomainLifecycleRecord> {
    const validation = this.validatePackage(domain);
    if (!validation.ok) {
      throw new Error(
        `Domain install validation failed: ${validation.errors
          .map((e) => e.message)
          .join("; ")}`
      );
    }
    if (this.records.has(domain.manifest.id)) {
      const existing = this.records.get(domain.manifest.id)!;
      if (existing.state !== "removed") {
        throw new Error(`Domain already installed: ${domain.manifest.id}`);
      }
    }
    const record: DomainLifecycleRecord = {
      domainId: domain.manifest.id,
      state: "installed",
      package: domain,
      installedAt: this.now(),
    };
    this.records.set(domain.manifest.id, record);
    return { ...record };
  }

  async initialize(domainId: string): Promise<DomainLifecycleRecord> {
    const record = this.require(domainId);
    this.transition(record, "initialized");
    return { ...record };
  }

  async activate(domainId: string): Promise<DomainLifecycleRecord> {
    const record = this.require(domainId);
    if (record.state === "active") {
      return { ...record };
    }
    if (record.state === "installed") {
      this.transition(record, "initialized");
    }
    if (record.state !== "initialized" && record.state !== "inactive") {
      this.assertTransition(record.state, "active");
    }
    try {
      await record.package.adapter.register(this.host.registrationApi);
      record.state = "active";
      record.activatedAt = this.now();
      record.deactivatedAt = undefined;
      record.lastError = undefined;
    } catch (error) {
      record.lastError =
        error instanceof Error ? error.message : "Activation failed";
      throw error;
    }
    return { ...record };
  }

  async deactivate(domainId: string): Promise<DomainLifecycleRecord> {
    const record = this.require(domainId);
    this.assertTransition(record.state, "inactive");
    if (record.package.adapter.unregister) {
      await record.package.adapter.unregister(this.host.registrationApi);
    }
    record.state = "inactive";
    record.deactivatedAt = this.now();
    return { ...record };
  }

  async upgrade(
    domainId: string,
    next: DomainPackage
  ): Promise<DomainLifecycleRecord> {
    if (next.manifest.id !== domainId) {
      throw new Error(
        `Upgrade domain id mismatch: expected ${domainId}, got ${next.manifest.id}`
      );
    }
    const record = this.require(domainId);
    const wasActive = record.state === "active";
    this.transition(record, "upgrading");

    const validation = this.validatePackage(next);
    if (!validation.ok) {
      record.state = wasActive ? "active" : "inactive";
      throw new Error(
        `Domain upgrade validation failed: ${validation.errors
          .map((e) => e.message)
          .join("; ")}`
      );
    }

    if (wasActive && record.package.adapter.unregister) {
      await record.package.adapter.unregister(this.host.registrationApi);
    }

    record.package = next;
    if (wasActive) {
      await next.adapter.register(this.host.registrationApi);
      record.state = "active";
      record.activatedAt = this.now();
    } else {
      record.state = "inactive";
    }
    return { ...record };
  }

  async remove(domainId: string): Promise<DomainLifecycleRecord> {
    const record = this.require(domainId);
    if (record.state === "active" && record.package.adapter.unregister) {
      await record.package.adapter.unregister(this.host.registrationApi);
    }
    this.assertTransition(record.state, "removed");
    record.state = "removed";
    record.removedAt = this.now();
    return { ...record };
  }

  get(domainId: string): DomainLifecycleRecord | undefined {
    const record = this.records.get(domainId);
    return record ? { ...record } : undefined;
  }

  list(): DomainLifecycleRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  private validatePackage(domain: DomainPackage): DomainValidationResult {
    return validateDomainManifest(domain.manifest, {
      bundle: domain.bundle,
      host: {
        runtimeVersion: this.host.runtimeVersion,
        coreVersion: this.host.coreVersion,
        sdkVersion: this.host.sdkVersion,
      },
    });
  }

  private require(domainId: string): DomainLifecycleRecord {
    const record = this.records.get(domainId);
    if (!record || record.state === "removed") {
      throw new Error(`Domain not found: ${domainId}`);
    }
    return record;
  }

  private transition(
    record: DomainLifecycleRecord,
    next: DomainLifecycleState
  ): void {
    this.assertTransition(record.state, next);
    record.state = next;
  }

  private assertTransition(
    from: DomainLifecycleState,
    to: DomainLifecycleState
  ): void {
    if (from === to) return;
    if (!ALLOWED[from].includes(to)) {
      throw new Error(`Invalid lifecycle transition: ${from} → ${to}`);
    }
  }

  private now(): string {
    return this.host.now?.() ?? new Date().toISOString();
  }
}
