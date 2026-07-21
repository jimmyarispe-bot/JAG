/**
 * In-memory store for normalized Google Workspace entities (integration cache, not SoR).
 */

import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export type GoogleWorkspaceStoreSnapshot = {
  organizationId: string;
  syncedAt: string | null;
  instanceId: string | null;
  records: GoogleWorkspaceCanonicalEntity[];
  byType: Record<string, GoogleWorkspaceCanonicalEntity[]>;
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

class GoogleWorkspaceNormalizedStore {
  private readonly byOrg = new Map<string, GoogleWorkspaceStoreSnapshot>();

  replace(
    organizationId: string,
    instanceId: string,
    normalized: NormalizedRecord[],
    monitoring?: Partial<GoogleWorkspaceStoreSnapshot["monitoring"]>
  ): GoogleWorkspaceStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as GoogleWorkspaceCanonicalEntity);
    const byType: Record<string, GoogleWorkspaceCanonicalEntity[]> = {};
    for (const record of records) {
      const key = record.objectType;
      byType[key] = byType[key] ?? [];
      byType[key]!.push(record);
    }
    const previous = this.byOrg.get(organizationId);
    const snapshot: GoogleWorkspaceStoreSnapshot = {
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
        tokenExpiresAt:
          monitoring?.tokenExpiresAt ?? previous?.monitoring.tokenExpiresAt ?? null,
        rateLimitRemaining:
          monitoring?.rateLimitRemaining ?? previous?.monitoring.rateLimitRemaining ?? 500,
        health: monitoring?.health ?? "healthy",
      },
    };
    this.byOrg.set(organizationId, snapshot);
    if (organizationId === "org-google-demo") {
      this.byOrg.set("exec-demo-org", snapshot);
    }
    if (organizationId === "exec-demo-org") {
      this.byOrg.set("org-google-demo", snapshot);
    }
    return snapshot;
  }

  get(organizationId: string): GoogleWorkspaceStoreSnapshot | null {
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
      },
    });
  }
}

export const googleWorkspaceStore = new GoogleWorkspaceNormalizedStore();
