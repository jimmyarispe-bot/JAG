/**
 * Phase 65 — Compose Command Center navigation for platform vs customer workspace.
 * Uses CapabilityLoader shell items + registry + FeatureFlagService (no parallel nav system).
 */

import {
  CapabilityLoader,
  CapabilityRegistry,
  ensureCapabilitiesRegistered,
  SHELL_NAVIGATION,
  type CapabilityNavItem,
} from "@/lib/platform/capabilities";
import { CUSTOMER_SHELL_ALLOWLIST_IDS } from "@/lib/platform/onboarding/customer-capabilities";
import { FeatureFlagService } from "@/lib/platform/tenant/FeatureFlagService";
import type { JagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";

export type WorkspaceNavContext = {
  readonly mode: JagWorkspaceMode;
  readonly organizationId: string | null;
};

export type JagCommandNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly group?: CapabilityNavItem["group"];
};

function sortNav(items: readonly CapabilityNavItem[]): CapabilityNavItem[] {
  return [...items].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

function toCommandNav(
  items: readonly CapabilityNavItem[]
): readonly JagCommandNavItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    group: item.group,
  }));
}

/**
 * Platform/admin: existing full discovery.
 * Customer: primary + intelligence from org-enabled capabilities; Settings allowlisted.
 */
export function composeWorkspaceNavigation(
  context: WorkspaceNavContext
): readonly JagCommandNavItem[] {
  ensureCapabilitiesRegistered();

  if (context.mode === "platform") {
    return toCommandNav(CapabilityLoader.discoverNavigation());
  }

  const organizationId = context.organizationId?.trim() ?? "";
  if (!organizationId) {
    // Fail closed — Overview + Settings only until an org is bound.
    return toCommandNav(
      sortNav(
        SHELL_NAVIGATION.filter((item) =>
          (CUSTOMER_SHELL_ALLOWLIST_IDS as readonly string[]).includes(item.id)
        )
      )
    );
  }

  const allowlist = new Set<string>(CUSTOMER_SHELL_ALLOWLIST_IDS);
  const shell = SHELL_NAVIGATION.filter((item) => {
    if (allowlist.has(item.id)) return true;
    const group = item.group ?? "primary";
    if (group === "platform" || group === "system") return false;
    return group === "primary" || group === "intelligence";
  });

  const byId = new Map<string, CapabilityNavItem>();
  for (const item of shell) byId.set(item.id, item);

  for (const registered of CapabilityRegistry.list()) {
    const capabilityId = registered.manifest.id;
    if (!FeatureFlagService.isEnabled(organizationId, capabilityId)) continue;

    for (const item of registered.manifest.navigation) {
      const group = item.group ?? "primary";
      if (group === "platform" || group === "system") continue;
      if (group !== "primary" && group !== "intelligence") continue;
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
  }

  return toCommandNav(sortNav([...byId.values()]));
}
