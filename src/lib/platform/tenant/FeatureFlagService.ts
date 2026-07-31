/**
 * Sprint 213 — Per-tenant feature flags (Capability SDK aligned).
 */

import {
  ensureCapabilitiesRegistered,
  formatCapabilityVersion,
} from "@/lib/platform/capabilities";
import { CapabilityLoader } from "@/lib/platform/capabilities/CapabilityLoader";
import { CapabilityRegistry } from "@/lib/platform/capabilities/CapabilityRegistry";
import { DEFAULT_FEATURE_FLAGS } from "./defaults";
import { recordOrganizationAdminAudit } from "./OrganizationObservability";
import { TenantRegistry } from "./TenantRegistry";
import type { TenantCapabilityView, TenantFeatureFlags } from "./types";

const KNOWN_FLAG_LABELS: Record<string, string> = {
  "jag.intelligence.predictive": "Forecasting",
  "jag.intelligence.conversation": "Conversation",
  "jag.intelligence.memory": "Memory",
  "jag.intelligence.strategy": "Strategy",
  "jag.intelligence.watchers": "Watchers",
  "jag.decisions.center": "Decision Intelligence",
  "jag.intelligence.briefings": "Briefings",
  "jag.intelligence.explainability": "Graph Explorer",
};

export const FeatureFlagService = {
  labelFor(flagId: string): string {
    return KNOWN_FLAG_LABELS[flagId] ?? flagId;
  },

  getFlags(organizationId: string): TenantFeatureFlags {
    const record = TenantRegistry.get(organizationId);
    if (!record) return { ...DEFAULT_FEATURE_FLAGS };
    return { ...DEFAULT_FEATURE_FLAGS, ...record.featureFlags };
  },

  isEnabled(organizationId: string, flagId: string): boolean {
    const flags = this.getFlags(organizationId);
    if (flagId in flags) return Boolean(flags[flagId]);
    // Unknown capability defaults to SDK manifest.enabled
    ensureCapabilitiesRegistered();
    return CapabilityRegistry.get(flagId)?.manifest.enabled ?? false;
  },

  setFlag(
    organizationId: string,
    flagId: string,
    enabled: boolean,
    actorLabel = "system"
  ): TenantFeatureFlags {
    const record = TenantRegistry.get(organizationId);
    if (!record) {
      throw new Error(`Organization ${organizationId} not found.`);
    }
    const featureFlags = {
      ...record.featureFlags,
      [flagId]: enabled,
    };
    TenantRegistry.upsert({ ...record, featureFlags });
    recordOrganizationAdminAudit({
      kind: "feature_flag_change",
      organizationId,
      actorLabel,
      detail: `${enabled ? "Enabled" : "Disabled"} feature ${this.labelFor(flagId)}`,
      metadata: { flagId, enabled: String(enabled) },
    });
    recordOrganizationAdminAudit({
      kind: "capability_change",
      organizationId,
      actorLabel,
      detail: `${enabled ? "Enabled" : "Disabled"} capability ${flagId}`,
      metadata: { capabilityId: flagId, enabled: String(enabled) },
    });
    return featureFlags;
  },

  listDiscoverableFlags(): readonly {
    id: string;
    label: string;
    description: string;
  }[] {
    ensureCapabilitiesRegistered();
    const fromSdk = CapabilityLoader.listCapabilities().map((c) => ({
      id: c.manifest.id,
      label: KNOWN_FLAG_LABELS[c.manifest.id] ?? c.manifest.name,
      description: c.manifest.description,
    }));
    // Ensure Graph Explorer / known flags appear even if renamed in SDK.
    const byId = new Map(fromSdk.map((f) => [f.id, f]));
    for (const [id, label] of Object.entries(KNOWN_FLAG_LABELS)) {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          label,
          description: `${label} capability`,
        });
      }
    }
    return [...byId.values()];
  },

  listCapabilities(organizationId: string): readonly TenantCapabilityView[] {
    ensureCapabilitiesRegistered();
    const flags = this.getFlags(organizationId);
    return CapabilityLoader.listCapabilities().map((c) => {
      const enabled =
        c.manifest.id in flags
          ? Boolean(flags[c.manifest.id])
          : c.manifest.enabled;
      return {
        id: c.manifest.id,
        name: c.manifest.name,
        version: formatCapabilityVersion(c.manifest.version),
        health: c.health.status,
        enabled,
        installed: true,
        dependencies: c.manifest.dependencies.map((d) => d.capabilityId),
        description: c.manifest.description,
      };
    });
  },
};
