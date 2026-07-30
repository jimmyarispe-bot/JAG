/**
 * CapabilityService — application façade — Sprint 207.
 */

import { ensureCapabilitiesRegistered } from "./bootstrap";
import { CapabilityLoader } from "./CapabilityLoader";
import { CapabilityRegistry, type RegisteredCapability } from "./CapabilityRegistry";
import type { CapabilityDependencyIssue } from "./CapabilityDependency";
import type { CapabilityManifest } from "./CapabilityManifest";
import {
  listCapabilityObservations,
  type CapabilityObservation,
} from "./observability";
import { formatCapabilityVersion } from "./CapabilityVersion";

export type CapabilityExplorerModel = {
  readonly capabilities: readonly {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
    readonly category: string;
    readonly enabled: boolean;
    readonly status: string;
    readonly health: string;
    readonly healthSummary: string;
    readonly dependencies: readonly string[];
    readonly routes: readonly { path: string; label: string }[];
    readonly providers: readonly string[];
    readonly featureFlags: Readonly<Record<string, boolean>>;
    readonly docsHref?: string;
    readonly sprint?: string;
  }[];
  readonly dependencyIssues: readonly CapabilityDependencyIssue[];
  readonly navigation: readonly { id: string; label: string; href: string }[];
  readonly conversationIntents: readonly {
    capabilityId: string;
    intents: readonly string[];
  }[];
  readonly briefingSections: readonly {
    capabilityId: string;
    sectionIds: readonly string[];
  }[];
  readonly watcherSources: readonly {
    capabilityId: string;
    watcherTypes: readonly string[];
  }[];
  readonly healthDashboard: readonly {
    capabilityId: string;
    name: string;
    status: string;
    summary: string;
  }[];
  readonly observations: readonly CapabilityObservation[];
  readonly advisoryNotice: string;
};

function toExplorerRow(entry: RegisteredCapability) {
  const m = entry.manifest;
  const providers: string[] = [];
  if (m.providers.search) providers.push("search");
  if (m.providers.conversation) providers.push("conversation");
  if (m.providers.briefing) providers.push("briefing");
  if (m.providers.watcher) providers.push("watcher");
  if (m.providers.observability) providers.push("observability");
  if (m.providers.health) providers.push("health");
  return {
    id: m.id,
    name: m.name,
    version: formatCapabilityVersion(m.version),
    description: m.description,
    category: m.category,
    enabled: m.enabled,
    status: entry.lifecycle.state,
    health: entry.health.status,
    healthSummary: entry.health.summary,
    dependencies: m.dependencies.map(
      (d) => `${d.capabilityId} (${d.versionRange}${d.optional ? ", optional" : ""})`
    ),
    routes: m.routes.map((r) => ({ path: r.path, label: r.label })),
    providers,
    featureFlags: m.featureFlags,
    docsHref: m.metadata.docsHref,
    sprint: m.metadata.sprint,
  };
}

export const CapabilityService = {
  ensureRegistered(): void {
    ensureCapabilitiesRegistered();
  },

  register(manifest: CapabilityManifest): RegisteredCapability {
    ensureCapabilitiesRegistered();
    return CapabilityRegistry.register(manifest);
  },

  get(id: string): RegisteredCapability | null {
    ensureCapabilitiesRegistered();
    return CapabilityRegistry.get(id);
  },

  explorer(): CapabilityExplorerModel {
    ensureCapabilitiesRegistered();
    const issues = CapabilityLoader.validate();
    return {
      capabilities: CapabilityRegistry.list().map(toExplorerRow),
      dependencyIssues: issues,
      navigation: CapabilityLoader.discoverNavigation().map((n) => ({
        id: n.id,
        label: n.label,
        href: n.href,
      })),
      conversationIntents: CapabilityLoader.discoverConversationProviders().map(
        (p) => ({
          capabilityId: p.capabilityId,
          intents: p.provider.intents,
        })
      ),
      briefingSections: CapabilityLoader.discoverBriefingProviders().map((p) => ({
        capabilityId: p.capabilityId,
        sectionIds: p.provider.sectionIds,
      })),
      watcherSources: CapabilityLoader.discoverWatcherProviders().map((p) => ({
        capabilityId: p.capabilityId,
        watcherTypes: p.provider.watcherTypes,
      })),
      healthDashboard: CapabilityLoader.discoverHealth().map((h) => ({
        capabilityId: h.capabilityId,
        name: h.name,
        status: h.health.status,
        summary: h.health.summary,
      })),
      observations: listCapabilityObservations(30),
      advisoryNotice:
        "Intelligence Capability SDK — capabilities self-register; the Executive Workspace discovers navigation, search, conversation, briefings, watchers, and health automatically.",
    };
  },
} as const;
