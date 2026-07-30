/**
 * CapabilityRegistry — single source of registered intelligence capabilities — Sprint 207.
 */

import type { CapabilityDependencyIssue } from "./CapabilityDependency";
import type { CapabilityHealth } from "./CapabilityHealth";
import type { CapabilityLifecycle } from "./CapabilityLifecycle";
import type { CapabilityManifest } from "./CapabilityManifest";
import {
  formatCapabilityVersion,
  parseCapabilityVersion,
  satisfiesVersion,
} from "./CapabilityVersion";
import { recordCapabilityObservation } from "./observability";

export type RegisteredCapability = {
  readonly manifest: CapabilityManifest;
  readonly lifecycle: CapabilityLifecycle;
  readonly health: CapabilityHealth;
};

const registry = new Map<string, RegisteredCapability>();
let bootstrapped = false;

function nowIso(): string {
  return new Date().toISOString();
}

function defaultHealth(enabled: boolean): CapabilityHealth {
  return {
    status: enabled ? "initializing" : "unavailable",
    checkedAt: nowIso(),
    summary: enabled ? "Registered — awaiting initialization." : "Disabled.",
  };
}

export const CapabilityRegistry = {
  isBootstrapped(): boolean {
    return bootstrapped;
  },

  markBootstrapped(): void {
    bootstrapped = true;
  },

  resetForTests(): void {
    registry.clear();
    bootstrapped = false;
  },

  register(manifest: CapabilityManifest): RegisteredCapability {
    const existing = registry.get(manifest.id);
    const at = nowIso();

    if (existing) {
      const prev = formatCapabilityVersion(existing.manifest.version);
      const next = formatCapabilityVersion(manifest.version);
      if (prev !== next) {
        recordCapabilityObservation({
          kind: "version_change",
          capabilityId: manifest.id,
          detail: `Version changed ${prev} → ${next}`,
          metadata: { from: prev, to: next },
        });
      }
    }

    const healthProvider = manifest.providers.health;
    const health = healthProvider
      ? healthProvider.check()
      : defaultHealth(manifest.enabled);

    const entry: RegisteredCapability = {
      manifest,
      lifecycle: {
        state: manifest.enabled
          ? health.status === "healthy"
            ? "ready"
            : health.status === "warning"
              ? "degraded"
              : health.status === "unavailable"
                ? "failed"
                : "initializing"
          : "disabled",
        registeredAt: existing?.lifecycle.registeredAt ?? at,
        initializedAt: at,
        lastTransitionAt: at,
        message: health.summary,
      },
      health,
    };

    registry.set(manifest.id, entry);
    recordCapabilityObservation({
      kind: existing ? "capability_initialization" : "capability_registration",
      capabilityId: manifest.id,
      detail: `${existing ? "Re-registered" : "Registered"} ${manifest.name} v${formatCapabilityVersion(manifest.version)}`,
      metadata: {
        category: manifest.category,
        enabled: String(manifest.enabled),
      },
    });
    return entry;
  },

  get(id: string): RegisteredCapability | null {
    return registry.get(id) ?? null;
  },

  list(): readonly RegisteredCapability[] {
    return [...registry.values()].sort((a, b) =>
      a.manifest.name.localeCompare(b.manifest.name)
    );
  },

  listEnabled(): readonly RegisteredCapability[] {
    return this.list().filter((c) => c.manifest.enabled);
  },

  refreshHealth(id: string): CapabilityHealth | null {
    const entry = registry.get(id);
    if (!entry) return null;
    const prev = entry.health.status;
    const next = entry.manifest.providers.health
      ? entry.manifest.providers.health.check()
      : entry.health;
    if (prev !== next.status) {
      recordCapabilityObservation({
        kind: "health_change",
        capabilityId: id,
        detail: `Health ${prev} → ${next.status}: ${next.summary}`,
        metadata: { from: prev, to: next.status },
      });
    }
    registry.set(id, {
      ...entry,
      health: next,
      lifecycle: {
        ...entry.lifecycle,
        state:
          !entry.manifest.enabled
            ? "disabled"
            : next.status === "healthy"
              ? "ready"
              : next.status === "warning"
                ? "degraded"
                : next.status === "unavailable"
                  ? "failed"
                  : "initializing",
        lastTransitionAt: nowIso(),
        message: next.summary,
      },
    });
    return next;
  },

  refreshAllHealth(): void {
    for (const id of registry.keys()) this.refreshHealth(id);
  },

  validateDependencies(): readonly CapabilityDependencyIssue[] {
    const issues: CapabilityDependencyIssue[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (id: string, stack: string[]) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        issues.push({
          kind: "circular",
          capabilityId: id,
          detail: `Circular dependency: ${[...stack, id].join(" → ")}`,
        });
        recordCapabilityObservation({
          kind: "dependency_failure",
          capabilityId: id,
          detail: `Circular dependency involving ${id}`,
        });
        return;
      }
      visiting.add(id);
      const entry = registry.get(id);
      if (!entry) {
        visiting.delete(id);
        return;
      }
      for (const dep of entry.manifest.dependencies) {
        const target = registry.get(dep.capabilityId);
        if (!target) {
          if (!dep.optional) {
            issues.push({
              kind: "missing",
              capabilityId: id,
              dependencyId: dep.capabilityId,
              detail: `Missing dependency ${dep.capabilityId} required by ${id}`,
            });
            recordCapabilityObservation({
              kind: "dependency_failure",
              capabilityId: id,
              detail: `Missing dependency ${dep.capabilityId}`,
            });
          }
          continue;
        }
        if (!target.manifest.enabled && !dep.optional) {
          issues.push({
            kind: "disabled",
            capabilityId: id,
            dependencyId: dep.capabilityId,
            detail: `Dependency ${dep.capabilityId} is disabled`,
          });
        }
        if (
          !satisfiesVersion(target.manifest.version, dep.versionRange)
        ) {
          issues.push({
            kind: "version_mismatch",
            capabilityId: id,
            dependencyId: dep.capabilityId,
            detail: `${dep.capabilityId} v${formatCapabilityVersion(target.manifest.version)} does not satisfy ${dep.versionRange}`,
          });
        }
        visit(dep.capabilityId, [...stack, id]);
      }
      visiting.delete(id);
      visited.add(id);
    };

    for (const id of registry.keys()) visit(id, []);

    // Provider conflicts: same watcher type claimed by multiple enabled capabilities
    const watcherOwners = new Map<string, string[]>();
    for (const entry of registry.values()) {
      if (!entry.manifest.enabled) continue;
      const types = entry.manifest.providers.watcher?.watcherTypes ?? [];
      for (const t of types) {
        const owners = watcherOwners.get(t) ?? [];
        owners.push(entry.manifest.id);
        watcherOwners.set(t, owners);
      }
    }
    for (const [type, owners] of watcherOwners) {
      if (owners.length > 1) {
        issues.push({
          kind: "provider_conflict",
          capabilityId: owners[0]!,
          detail: `Watcher type "${type}" claimed by: ${owners.join(", ")}`,
        });
      }
    }

    return issues;
  },
} as const;

export function capabilityVersionFromString(raw: string) {
  return parseCapabilityVersion(raw);
}
