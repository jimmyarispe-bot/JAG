/**
 * Capability health validation — Sprint 209.
 * Uses Capability SDK APIs only. No new intelligence capabilities.
 */

import {
  CapabilityRegistry,
  ensureCapabilitiesRegistered,
  formatCapabilityVersion,
  type RegisteredCapability,
} from "@/lib/platform/capabilities";
import type { CapabilityHealthReport } from "./types";

function providerNames(entry: RegisteredCapability): string[] {
  const p = entry.manifest.providers;
  const names: string[] = [];
  if (p.search) names.push("search");
  if (p.conversation) names.push("conversation");
  if (p.briefing) names.push("briefing");
  if (p.watcher) names.push("watcher");
  if (p.observability) names.push("observability");
  if (p.health) names.push("health");
  return names;
}

function toReport(
  entry: RegisteredCapability,
  dependencyIssueDetails: readonly string[]
): CapabilityHealthReport {
  const m = entry.manifest;
  const healthy = entry.health.status === "healthy";
  const version = formatCapabilityVersion(m.version);
  const providers = providerNames(entry);
  const routes = m.routes.map((r) => ({ path: r.path, label: r.label }));
  const permissions = {
    required: m.permissions.required.map((p) => p.id),
    optional: m.permissions.optional.map((p) => p.id),
  };
  const observability = m.providers.observability?.surfaceLabel ?? null;

  const ok =
    m.enabled &&
    healthy &&
    dependencyIssueDetails.length === 0 &&
    Boolean(m.id) &&
    Boolean(version);

  const detailParts: string[] = [
    `v${version}`,
    entry.health.status,
    entry.lifecycle.state,
    `${providers.length} provider(s)`,
    `${routes.length} route(s)`,
  ];
  if (dependencyIssueDetails.length > 0) {
    detailParts.push(`${dependencyIssueDetails.length} dependency issue(s)`);
  }

  return {
    id: m.id,
    name: m.name,
    healthy,
    healthStatus: entry.health.status,
    healthSummary: entry.health.summary,
    version,
    enabled: m.enabled,
    lifecycle: entry.lifecycle.state,
    dependencies: m.dependencies.map(
      (d) =>
        `${d.capabilityId} (${d.versionRange}${d.optional ? ", optional" : ""})`
    ),
    providers,
    routes,
    permissions,
    observability,
    dependencyIssues: dependencyIssueDetails,
    ok,
    detail: detailParts.join(" · "),
  };
}

/**
 * Validate every registered capability via CapabilityRegistry.
 */
export function validateRegisteredCapabilities(): readonly CapabilityHealthReport[] {
  ensureCapabilitiesRegistered();
  CapabilityRegistry.refreshAllHealth();
  const issues = CapabilityRegistry.validateDependencies();

  const issuesByCap = new Map<string, string[]>();
  for (const issue of issues) {
    const list = issuesByCap.get(issue.capabilityId) ?? [];
    list.push(issue.detail);
    issuesByCap.set(issue.capabilityId, list);
  }

  return CapabilityRegistry.list().map((entry) =>
    toReport(entry, issuesByCap.get(entry.manifest.id) ?? [])
  );
}
