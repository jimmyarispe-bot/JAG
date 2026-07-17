/**
 * In-memory store for normalized Plaid entities (integration cache, not SoR).
 */

import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type { PlaidCanonicalEntity } from "./entities";

export type PlaidStoreSnapshot = {
  organizationId: string;
  syncedAt: string | null;
  instanceId: string | null;
  records: PlaidCanonicalEntity[];
  byType: Record<string, PlaidCanonicalEntity[]>;
  monitoring: {
    lastSyncAt: string | null;
    lastSyncDurationMs: number | null;
    apiLatencyMs: number | null;
    accountsImported: number;
    transactionsImported: number;
    recordsImported: number;
    failures: number;
    retryCount: number;
    linkExpiresAt: string | null;
    institutionHealth: "healthy" | "degraded" | "error" | "unknown";
    rateLimitRemaining: number | null;
    health: "healthy" | "degraded" | "error" | "unknown";
  };
};

class PlaidNormalizedStore {
  private readonly byOrg = new Map<string, PlaidStoreSnapshot>();

  replace(
    organizationId: string,
    instanceId: string,
    normalized: NormalizedRecord[],
    monitoring?: Partial<PlaidStoreSnapshot["monitoring"]>
  ): PlaidStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as PlaidCanonicalEntity);
    const byType: Record<string, PlaidCanonicalEntity[]> = {};
    for (const record of records) {
      const key = record.objectType;
      byType[key] = byType[key] ?? [];
      byType[key]!.push(record);
    }
    const previous = this.byOrg.get(organizationId);
    const snapshot: PlaidStoreSnapshot = {
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
        accountsImported: monitoring?.accountsImported ?? (byType.account?.length ?? 0),
        transactionsImported:
          monitoring?.transactionsImported ?? (byType.transaction?.length ?? 0),
        recordsImported: monitoring?.recordsImported ?? records.length,
        failures: monitoring?.failures ?? previous?.monitoring.failures ?? 0,
        retryCount: monitoring?.retryCount ?? previous?.monitoring.retryCount ?? 0,
        linkExpiresAt: monitoring?.linkExpiresAt ?? previous?.monitoring.linkExpiresAt ?? null,
        institutionHealth: monitoring?.institutionHealth ?? previous?.monitoring.institutionHealth ?? "healthy",
        rateLimitRemaining:
          monitoring?.rateLimitRemaining ?? previous?.monitoring.rateLimitRemaining ?? 500,
        health: monitoring?.health ?? "healthy",
      },
    };
    this.byOrg.set(organizationId, snapshot);
    if (organizationId === "org-plaid-demo") {
      this.byOrg.set("exec-demo-org", snapshot);
    }
    if (organizationId === "exec-demo-org") {
      this.byOrg.set("org-plaid-demo", snapshot);
    }
    return snapshot;
  }

  get(organizationId: string): PlaidStoreSnapshot | null {
    return this.byOrg.get(organizationId) ?? null;
  }

  clear(organizationId?: string): void {
    if (!organizationId) {
      this.byOrg.clear();
      return;
    }
    this.byOrg.delete(organizationId);
  }

  hasLiveData(organizationId: string): boolean {
    const snap = this.get(organizationId);
    return Boolean(snap && snap.records.length > 0);
  }

  isStale(organizationId: string, maxAgeMs = 15 * 60 * 1000): boolean {
    const snap = this.get(organizationId);
    if (!snap?.syncedAt) return true;
    return Date.now() - new Date(snap.syncedAt).getTime() > maxAgeMs;
  }

  bumpFailure(organizationId: string): void {
    const snap = this.get(organizationId);
    if (!snap) return;
    this.byOrg.set(organizationId, {
      ...snap,
      monitoring: {
        ...snap.monitoring,
        failures: snap.monitoring.failures + 1,
        health: "error",
        institutionHealth: "error",
      },
    });
  }
}

export const plaidStore = new PlaidNormalizedStore();
