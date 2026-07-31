import type {
  PackageContribution,
  PackageContributionKind,
  PackageId,
  PackageLifecycleState,
  PackageManifest,
  PackageMetrics,
  PackageRecord,
  PackageResult,
} from "@/jag/packages/contracts/definitions";
import { validatePackageDependencyGraph } from "@/jag/packages/dependency";
import { emitPackageEvent } from "@/jag/packages/events";
import { assertPackageLifecycleTransition } from "@/jag/packages/lifecycle";
import {
  parsePackageVersion,
  satisfiesMaxVersion,
  satisfiesMinVersion,
} from "@/jag/packages/manifest";
import { validatePackageManifest } from "@/jag/packages/validation";

const records = new Map<PackageId, PackageRecord>();
const contributions = new Map<
  PackageContributionKind,
  Map<PackageId, readonly string[]>
>();

let nowFn: () => Date = () => new Date();

export function setPackageRegistryClockForTests(fn: (() => Date) | null): void {
  nowFn = fn ?? (() => new Date());
}

function iso(): string {
  return nowFn().toISOString();
}

function fail(code: string, message: string): PackageResult<never> {
  return { ok: false, error: { code, message } };
}

function indexContributions(
  packageId: PackageId,
  list: readonly PackageContribution[]
): void {
  for (const contrib of list) {
    let byPkg = contributions.get(contrib.kind);
    if (!byPkg) {
      byPkg = new Map();
      contributions.set(contrib.kind, byPkg);
    }
    byPkg.set(packageId, Object.freeze([...contrib.ids]));
  }
}

function clearContributions(packageId: PackageId): void {
  for (const byPkg of contributions.values()) {
    byPkg.delete(packageId);
  }
}

function freezeManifest(manifest: PackageManifest): PackageManifest {
  return Object.freeze({
    ...manifest,
    metadata: Object.freeze({
      ...manifest.metadata,
      tags: manifest.metadata.tags
        ? Object.freeze([...manifest.metadata.tags])
        : undefined,
    }),
    contributions: Object.freeze(
      manifest.contributions.map((c) =>
        Object.freeze({ ...c, ids: Object.freeze([...c.ids]) })
      )
    ),
    dependencies: manifest.dependencies
      ? Object.freeze(manifest.dependencies.map((d) => Object.freeze({ ...d })))
      : undefined,
    capabilities: manifest.capabilities
      ? Object.freeze(manifest.capabilities.map((c) => Object.freeze({ ...c })))
      : undefined,
    extensions: manifest.extensions
      ? Object.freeze(
          manifest.extensions.map((e) =>
            Object.freeze({
              ...e,
              referenceIds: e.referenceIds
                ? Object.freeze([...e.referenceIds])
                : undefined,
            })
          )
        )
      : undefined,
    compatibility: manifest.compatibility
      ? Object.freeze({ ...manifest.compatibility })
      : undefined,
  });
}

function transition(
  record: PackageRecord,
  to: PackageLifecycleState,
  patch?: Partial<PackageRecord>
): PackageRecord {
  assertPackageLifecycleTransition(record.state, to);
  const next: PackageRecord = Object.freeze({
    ...record,
    ...patch,
    state: to,
    manifest: record.manifest,
    version: record.version,
  });
  records.set(next.manifest.metadata.id, next);
  return next;
}

function installedForDeps(): PackageRecord[] {
  return [...records.values()].filter((r) => r.state !== "removed");
}

export function discoverPackage(
  manifest: PackageManifest
): PackageResult<{ record: PackageRecord }> {
  const issues = validatePackageManifest(manifest);
  if (issues.length) {
    return fail("invalid_manifest", issues.map((i) => i.message).join("; "));
  }

  const id = manifest.metadata.id;
  const existing = records.get(id);
  if (existing && existing.state !== "removed") {
    return fail(
      "duplicate",
      `Package "${id}" is already registered in state "${existing.state}"`
    );
  }

  const version = parsePackageVersion(manifest.metadata.version);
  const at = iso();
  const record: PackageRecord = Object.freeze({
    manifest: freezeManifest(manifest),
    version,
    state: "discovered",
    discoveredAt: at,
  });
  records.set(id, record);

  const event = emitPackageEvent({
    type: "package.discovered",
    packageId: id,
    occurredAt: at,
    data: { version: version.raw },
  });
  return { ok: true, value: { record }, events: [event] };
}

export function validatePackage(
  packageId: PackageId,
  options?: { jagVersion?: string }
): PackageResult<{ record: PackageRecord }> {
  const record = records.get(packageId);
  if (!record) return fail("not_found", `Package "${packageId}" not found`);

  const issues = validatePackageManifest(record.manifest);
  if (issues.length) {
    return fail("invalid_manifest", issues.map((i) => i.message).join("; "));
  }

  if (options?.jagVersion && record.manifest.compatibility) {
    const { jagMinVersion, jagMaxVersion } = record.manifest.compatibility;
    if (jagMinVersion && !satisfiesMinVersion(options.jagVersion, jagMinVersion)) {
      return fail(
        "incompatible_jag",
        `Requires JAG >= ${jagMinVersion}, got ${options.jagVersion}`
      );
    }
    if (jagMaxVersion && !satisfiesMaxVersion(options.jagVersion, jagMaxVersion)) {
      return fail(
        "incompatible_jag",
        `Requires JAG <= ${jagMaxVersion}, got ${options.jagVersion}`
      );
    }
  }

  const at = iso();
  const next = transition(record, "validated");
  const event = emitPackageEvent({
    type: "package.validated",
    packageId,
    occurredAt: at,
  });
  return { ok: true, value: { record: next }, events: [event] };
}

export function installPackage(
  packageId: PackageId
): PackageResult<{ record: PackageRecord }> {
  const record = records.get(packageId);
  if (!record) return fail("not_found", `Package "${packageId}" not found`);

  const depIssues = validatePackageDependencyGraph({
    candidateId: packageId,
    dependencies: record.manifest.dependencies ?? [],
    installed: installedForDeps().filter((r) => r.manifest.metadata.id !== packageId),
  });
  if (depIssues.length) {
    emitPackageEvent({
      type: "package.dependency_rejected",
      packageId,
      occurredAt: iso(),
      data: { issues: depIssues },
    });
    return fail(
      "dependency_rejected",
      depIssues.map((i) => i.message).join("; ")
    );
  }

  const at = iso();
  const next = transition(record, "installed", { installedAt: at });
  const event = emitPackageEvent({
    type: "package.installed",
    packageId,
    occurredAt: at,
  });
  return { ok: true, value: { record: next }, events: [event] };
}

export function initializePackage(
  packageId: PackageId
): PackageResult<{ record: PackageRecord }> {
  const record = records.get(packageId);
  if (!record) return fail("not_found", `Package "${packageId}" not found`);

  const at = iso();
  indexContributions(packageId, record.manifest.contributions);
  const next = transition(record, "initialized");
  const events = [
    emitPackageEvent({
      type: "package.initialized",
      packageId,
      occurredAt: at,
    }),
    emitPackageEvent({
      type: "package.contributions_registered",
      packageId,
      occurredAt: at,
      data: {
        kinds: record.manifest.contributions.map((c) => c.kind),
      },
    }),
  ];
  return { ok: true, value: { record: next }, events };
}

export function activatePackage(
  packageId: PackageId
): PackageResult<{ record: PackageRecord }> {
  const record = records.get(packageId);
  if (!record) return fail("not_found", `Package "${packageId}" not found`);

  // Re-check deps against other active/installed packages
  const depIssues = validatePackageDependencyGraph({
    candidateId: packageId,
    dependencies: record.manifest.dependencies ?? [],
    installed: installedForDeps().filter((r) => r.manifest.metadata.id !== packageId),
  });
  if (depIssues.length) {
    return fail(
      "dependency_rejected",
      depIssues.map((i) => i.message).join("; ")
    );
  }

  if (
    record.state !== "initialized" &&
    record.state !== "suspended" &&
    record.state !== "deactivated"
  ) {
    return fail(
      "invalid_state",
      `Cannot activate package in state "${record.state}"`
    );
  }

  const at = iso();

  const next = transition(record, "activated", { activatedAt: at });
  const event = emitPackageEvent({
    type: "package.activated",
    packageId,
    occurredAt: at,
  });
  return { ok: true, value: { record: next }, events: [event] };
}

export function suspendPackage(
  packageId: PackageId
): PackageResult<{ record: PackageRecord }> {
  const record = records.get(packageId);
  if (!record) return fail("not_found", `Package "${packageId}" not found`);
  const at = iso();
  const next = transition(record, "suspended", { suspendedAt: at });
  const event = emitPackageEvent({
    type: "package.suspended",
    packageId,
    occurredAt: at,
  });
  return { ok: true, value: { record: next }, events: [event] };
}

export function deactivatePackage(
  packageId: PackageId
): PackageResult<{ record: PackageRecord }> {
  const record = records.get(packageId);
  if (!record) return fail("not_found", `Package "${packageId}" not found`);
  const at = iso();
  const next = transition(record, "deactivated", { deactivatedAt: at });
  const event = emitPackageEvent({
    type: "package.deactivated",
    packageId,
    occurredAt: at,
  });
  return { ok: true, value: { record: next }, events: [event] };
}

export function removePackage(
  packageId: PackageId
): PackageResult<{ record: PackageRecord }> {
  const record = records.get(packageId);
  if (!record) return fail("not_found", `Package "${packageId}" not found`);
  if (record.state === "activated" || record.state === "suspended") {
    return fail(
      "invalid_state",
      `Deactivate package "${packageId}" before removal`
    );
  }
  const at = iso();
  clearContributions(packageId);
  const next = transition(record, "removed", { removedAt: at });
  const event = emitPackageEvent({
    type: "package.removed",
    packageId,
    occurredAt: at,
  });
  return { ok: true, value: { record: next }, events: [event] };
}

export function getPackageRecord(packageId: PackageId): PackageRecord | null {
  return records.get(packageId) ?? null;
}

export function listPackages(filter?: {
  state?: PackageLifecycleState;
}): PackageRecord[] {
  let all = [...records.values()].sort((a, b) =>
    a.manifest.metadata.id.localeCompare(b.manifest.metadata.id)
  );
  if (filter?.state) all = all.filter((r) => r.state === filter.state);
  return all;
}

export function listPackageContributions(filter?: {
  kind?: PackageContributionKind;
  packageId?: PackageId;
}): Array<{
  kind: PackageContributionKind;
  packageId: PackageId;
  ids: readonly string[];
}> {
  const out: Array<{
    kind: PackageContributionKind;
    packageId: PackageId;
    ids: readonly string[];
  }> = [];
  for (const [kind, byPkg] of contributions) {
    if (filter?.kind && kind !== filter.kind) continue;
    for (const [packageId, ids] of byPkg) {
      if (filter?.packageId && packageId !== filter.packageId) continue;
      out.push({ kind, packageId, ids });
    }
  }
  return out.sort(
    (a, b) =>
      a.kind.localeCompare(b.kind) || a.packageId.localeCompare(b.packageId)
  );
}

export function getPackageMetrics(packageId: PackageId): PackageMetrics | null {
  const record = records.get(packageId);
  if (!record) return null;
  return {
    packageId,
    state: record.state,
    contributionCount: record.manifest.contributions.reduce(
      (n, c) => n + c.ids.length,
      0
    ),
    dependencyCount: record.manifest.dependencies?.length ?? 0,
    activatedAt: record.activatedAt,
  };
}

export function resetPackageRegistryForTests(): void {
  records.clear();
  contributions.clear();
  nowFn = () => new Date();
}

export const PackageRegistry = {
  discover: discoverPackage,
  validate: validatePackage,
  install: installPackage,
  initialize: initializePackage,
  activate: activatePackage,
  suspend: suspendPackage,
  deactivate: deactivatePackage,
  remove: removePackage,
  get: getPackageRecord,
  list: listPackages,
  listContributions: listPackageContributions,
  getMetrics: getPackageMetrics,
  resetForTests: resetPackageRegistryForTests,
} as const;
