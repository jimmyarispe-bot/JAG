import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type { Microsoft365CanonicalEntity } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export type Microsoft365StoreSnapshot = {
  organizationId: string;
  syncedAt: string | null;
  instanceId: string | null;
  records: Microsoft365CanonicalEntity[];
  byType: Record<string, Microsoft365CanonicalEntity[]>;
  monitoring: {
    lastSyncAt: string | null;
    lastSyncDurationMs: number | null;
    apiLatencyMs: number | null;
    recordsImported: number;
    failures: number;
    retryCount: number;
    tokenExpiresAt: string | null;
    rateLimitRemaining: number | null;
    health: "healthy" | "degraded" | "error" | "unknown";
  };
};

class Microsoft365NormalizedStore {
  private readonly byOrg = new Map<string, Microsoft365StoreSnapshot>();

  replace(
    organizationId: string,
    instanceId: string,
    normalized: NormalizedRecord[],
    monitoring?: Partial<Microsoft365StoreSnapshot["monitoring"]>
  ): Microsoft365StoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as Microsoft365CanonicalEntity);
    const byType: Record<string, Microsoft365CanonicalEntity[]> = {};
    for (const record of records) {
      byType[record.objectType] = byType[record.objectType] ?? [];
      byType[record.objectType]!.push(record);
    }
    const previous = this.byOrg.get(organizationId);
    const snapshot: Microsoft365StoreSnapshot = {
      organizationId,
      syncedAt,
      instanceId,
      records,
      byType,
      monitoring: {
        lastSyncAt: monitoring?.lastSyncAt ?? syncedAt,
        lastSyncDurationMs:
          monitoring?.lastSyncDurationMs ?? previous?.monitoring.lastSyncDurationMs ?? null,
        apiLatencyMs: monitoring?.apiLatencyMs ?? previous?.monitoring.apiLatencyMs ?? null,
        recordsImported: monitoring?.recordsImported ?? records.length,
        failures: monitoring?.failures ?? previous?.monitoring.failures ?? 0,
        retryCount: monitoring?.retryCount ?? previous?.monitoring.retryCount ?? 0,
        tokenExpiresAt: monitoring?.tokenExpiresAt ?? previous?.monitoring.tokenExpiresAt ?? null,
        rateLimitRemaining:
          monitoring?.rateLimitRemaining ?? previous?.monitoring.rateLimitRemaining ?? 500,
        health: monitoring?.health ?? "healthy",
      },
    };
    this.byOrg.set(organizationId, snapshot);
    if (organizationId === "org-microsoft-demo") {
      this.byOrg.set("exec-demo-org", snapshot);
    }
    return snapshot;
  }

  get(organizationId: string): Microsoft365StoreSnapshot | null {
    return this.byOrg.get(organizationId) ?? null;
  }

  bumpFailure(organizationId: string): void {
    const previous = this.byOrg.get(organizationId);
    if (!previous) return;
    this.byOrg.set(organizationId, {
      ...previous,
      monitoring: {
        ...previous.monitoring,
        failures: previous.monitoring.failures + 1,
        health: "error",
      },
    });
  }

  clear(organizationId?: string): void {
    if (organizationId) {
      this.byOrg.delete(organizationId);
      return;
    }
    this.byOrg.clear();
  }
}

export const microsoft365Store = new Microsoft365NormalizedStore();
