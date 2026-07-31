/**
 * Sprint 213 — Tenant usage metrics (application-layer aggregates).
 */

import { listBriefings } from "@/lib/jag-command-center/briefing-engine/store";
import { listJagNotifications } from "@/lib/jag-command-center/notifications";
import { TenantRegistry } from "./TenantRegistry";
import type { TenantUsageMetrics } from "./types";
import { defaultUsage } from "./defaults";

export const UsageService = {
  getUsage(organizationId: string): TenantUsageMetrics {
    const record = TenantRegistry.get(organizationId);
    const base = record?.usage ?? defaultUsage(organizationId);

    // Live overlays from in-memory CC stores where available.
    const briefings = listBriefings({ organizationId, limit: 500 }).length;
    const watcherAlerts = listJagNotifications(200).filter(
      (n) =>
        n.organizationId === organizationId ||
        (n.organizationId == null && organizationId)
    ).length;

    return {
      ...base,
      briefingsGenerated: Math.max(base.briefingsGenerated, briefings),
      watcherAlerts: Math.max(base.watcherAlerts, watcherAlerts),
      measuredAt: new Date().toISOString(),
    };
  },

  recordUsageDelta(
    organizationId: string,
    delta: Partial<
      Omit<TenantUsageMetrics, "organizationId" | "measuredAt">
    >
  ): TenantUsageMetrics {
    const record = TenantRegistry.get(organizationId);
    if (!record) return defaultUsage(organizationId);
    const usage: TenantUsageMetrics = {
      ...record.usage,
      ...Object.fromEntries(
        Object.entries(delta).map(([k, v]) => {
          const key = k as keyof TenantUsageMetrics;
          const prev = record.usage[key];
          if (typeof prev === "number" && typeof v === "number") {
            return [k, prev + v];
          }
          return [k, v];
        })
      ),
      organizationId,
      measuredAt: new Date().toISOString(),
    };
    TenantRegistry.upsert({ ...record, usage });
    return usage;
  },

  seedDemoUsage(organizationId: string): TenantUsageMetrics {
    const record = TenantRegistry.get(organizationId);
    if (!record) return defaultUsage(organizationId);
    const usage: TenantUsageMetrics = {
      organizationId,
      executiveUsers: Math.max(record.usage.executiveUsers, 3),
      organizations: 1,
      apiUsage: Math.max(record.usage.apiUsage, 1280),
      storageGb: Math.max(record.usage.storageGb, 2.4),
      documents: Math.max(record.usage.documents, 42),
      briefingsGenerated: Math.max(record.usage.briefingsGenerated, 12),
      watcherAlerts: Math.max(record.usage.watcherAlerts, 7),
      conversationSessions: Math.max(record.usage.conversationSessions, 18),
      forecastsCreated: Math.max(record.usage.forecastsCreated, 9),
      measuredAt: new Date().toISOString(),
    };
    TenantRegistry.upsert({ ...record, usage });
    return usage;
  },
};
