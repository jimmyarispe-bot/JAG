/**
 * CapabilityLoader — discover navigation, search, providers from registry — Sprint 207.
 */

import { CapabilityRegistry } from "./CapabilityRegistry";
import type { CapabilityDependencyIssue } from "./CapabilityDependency";
import type { CapabilityHealth } from "./CapabilityHealth";
import type {
  CapabilityBriefingProvider,
  CapabilityConversationProvider,
  CapabilityNavItem,
  CapabilityObservabilityProvider,
  CapabilityRoute,
  CapabilitySearchItem,
  CapabilityWatcherProvider,
} from "./CapabilityProvider";
import type { RegisteredCapability } from "./CapabilityRegistry";
import { formatCapabilityVersion } from "./CapabilityVersion";

/** Shell navigation always present (workspace chrome). */
export const SHELL_NAVIGATION: readonly CapabilityNavItem[] = [
  { id: "overview", label: "Overview", href: "/jag", order: 0, group: "primary" },
  {
    id: "organizations",
    label: "Organizations",
    href: "/jag/organizations",
    order: 80,
    group: "platform",
  },
  { id: "domains", label: "Domains", href: "/jag/domains", order: 81, group: "platform" },
  {
    id: "capability-packs",
    label: "Capability Packs",
    href: "/jag/capability-packs",
    order: 82,
    group: "platform",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    href: "/jag/knowledge",
    order: 83,
    group: "platform",
  },
  {
    id: "policies",
    label: "Policies",
    href: "/jag/policies",
    order: 84,
    group: "platform",
  },
  {
    id: "intelligence-graph",
    label: "Intelligence Graph",
    href: "/jag/intelligence-graph",
    order: 85,
    group: "platform",
  },
  {
    id: "capabilities",
    label: "Capabilities",
    href: "/jag/capabilities",
    order: 86,
    group: "system",
  },
  {
    id: "observability",
    label: "Observability",
    href: "/jag/observability",
    order: 90,
    group: "system",
  },
  { id: "runtime", label: "Runtime", href: "/jag/runtime", order: 91, group: "system" },
  {
    id: "settings",
    label: "Settings",
    href: "/jag/settings",
    order: 99,
    group: "system",
  },
] as const;

function sortNav(items: readonly CapabilityNavItem[]): CapabilityNavItem[] {
  return [...items].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

export const CapabilityLoader = {
  listCapabilities(): readonly RegisteredCapability[] {
    return CapabilityRegistry.list();
  },

  discoverNavigation(): readonly CapabilityNavItem[] {
    const fromCaps = CapabilityRegistry.listEnabled().flatMap(
      (c) => c.manifest.navigation
    );
    const byId = new Map<string, CapabilityNavItem>();
    for (const item of [...SHELL_NAVIGATION, ...fromCaps]) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
    return sortNav([...byId.values()]);
  },

  discoverRoutes(): readonly CapabilityRoute[] {
    return CapabilityRegistry.listEnabled().flatMap((c) => c.manifest.routes);
  },

  discoverSearchItems(): readonly CapabilitySearchItem[] {
    const items: CapabilitySearchItem[] = [];
    for (const nav of this.discoverNavigation()) {
      items.push({
        id: `nav:${nav.id}`,
        title: nav.label,
        subtitle: "Navigation",
        href: nav.href,
        kind: "navigation",
      });
    }
    for (const cap of CapabilityRegistry.listEnabled()) {
      const providerItems = cap.manifest.providers.search?.listItems() ?? [];
      items.push(...providerItems);
      items.push({
        id: `capability:${cap.manifest.id}`,
        title: cap.manifest.name,
        subtitle: `Capability · v${formatCapabilityVersion(cap.manifest.version)}`,
        href: `/jag/capabilities?id=${encodeURIComponent(cap.manifest.id)}`,
        kind: "capability",
      });
    }
    return items;
  },

  discoverConversationProviders(): readonly {
    readonly capabilityId: string;
    readonly provider: CapabilityConversationProvider;
  }[] {
    return CapabilityRegistry.listEnabled()
      .filter((c) => c.manifest.providers.conversation)
      .map((c) => ({
        capabilityId: c.manifest.id,
        provider: c.manifest.providers.conversation!,
      }));
  },

  discoverBriefingProviders(): readonly {
    readonly capabilityId: string;
    readonly provider: CapabilityBriefingProvider;
  }[] {
    return CapabilityRegistry.listEnabled()
      .filter((c) => c.manifest.providers.briefing)
      .map((c) => ({
        capabilityId: c.manifest.id,
        provider: c.manifest.providers.briefing!,
      }));
  },

  discoverWatcherProviders(): readonly {
    readonly capabilityId: string;
    readonly provider: CapabilityWatcherProvider;
  }[] {
    return CapabilityRegistry.listEnabled()
      .filter((c) => c.manifest.providers.watcher)
      .map((c) => ({
        capabilityId: c.manifest.id,
        provider: c.manifest.providers.watcher!,
      }));
  },

  discoverObservabilityProviders(): readonly {
    readonly capabilityId: string;
    readonly provider: CapabilityObservabilityProvider;
  }[] {
    return CapabilityRegistry.listEnabled()
      .filter((c) => c.manifest.providers.observability)
      .map((c) => ({
        capabilityId: c.manifest.id,
        provider: c.manifest.providers.observability!,
      }));
  },

  discoverHealth(): readonly {
    readonly capabilityId: string;
    readonly name: string;
    readonly health: CapabilityHealth;
  }[] {
    CapabilityRegistry.refreshAllHealth();
    return CapabilityRegistry.list().map((c) => ({
      capabilityId: c.manifest.id,
      name: c.manifest.name,
      health: c.health,
    }));
  },

  validate(): readonly CapabilityDependencyIssue[] {
    return CapabilityRegistry.validateDependencies();
  },
} as const;
