/**
 * In-memory store for normalized Square entities (integration cache, not SoR).
 */

import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type { SquareCanonicalEntity } from "./entities";

export type SquareStoreSnapshot = {
  organizationId: string;
  syncedAt: string | null;
  instanceId: string | null;
  records: SquareCanonicalEntity[];
  byType: Record<string, SquareCanonicalEntity[]>;
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
    webhookStatus: "idle" | "active" | "error";
    lastPaymentImportedAt: string | null;
  };
};

class SquareNormalizedStore {
  private readonly byOrg = new Map<string, SquareStoreSnapshot>();

  replace(
    organizationId: string,
    instanceId: string,
    normalized: NormalizedRecord[],
    monitoring?: Partial<SquareStoreSnapshot["monitoring"]>
  ): SquareStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as SquareCanonicalEntity);
    const byType: Record<string, SquareCanonicalEntity[]> = {};
    for (const record of records) {
      const key = record.objectType;
      byType[key] = byType[key] ?? [];
      byType[key]!.push(record);
    }

    const payments = byType.payment ?? [];
    const lastPayment =
      payments
        .slice()
        .sort((a, b) =>
          String(b.attributes.createdAt ?? b.syncedAt).localeCompare(
            String(a.attributes.createdAt ?? a.syncedAt)
          )
        )[0] ?? null;

    const previous = this.byOrg.get(organizationId);
    const snapshot: SquareStoreSnapshot = {
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
          monitoring?.rateLimitRemaining ?? previous?.monitoring.rateLimitRemaining ?? 1000,
        health: monitoring?.health ?? previous?.monitoring.health ?? "healthy",
        webhookStatus:
          monitoring?.webhookStatus ?? previous?.monitoring.webhookStatus ?? "idle",
        lastPaymentImportedAt:
          monitoring?.lastPaymentImportedAt ??
          (lastPayment
            ? String(lastPayment.attributes.createdAt ?? lastPayment.syncedAt)
            : previous?.monitoring.lastPaymentImportedAt ?? null),
      },
    };
    this.byOrg.set(organizationId, snapshot);
    if (organizationId === "org-square-demo") {
      this.byOrg.set("exec-demo-org", snapshot);
    }
    if (organizationId === "exec-demo-org") {
      this.byOrg.set("org-square-demo", snapshot);
    }
    return snapshot;
  }

  get(organizationId: string): SquareStoreSnapshot | null {
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

  /** True when store has data but last sync is older than maxAgeMs. */
  isStale(organizationId: string, maxAgeMs = 15 * 60 * 1000): boolean {
    const snap = this.get(organizationId);
    if (!snap?.syncedAt) return true;
    return Date.now() - new Date(snap.syncedAt).getTime() > maxAgeMs;
  }

  recordWebhookStatus(
    organizationId: string,
    status: SquareStoreSnapshot["monitoring"]["webhookStatus"]
  ): void {
    const snap = this.get(organizationId);
    if (!snap) return;
    this.byOrg.set(organizationId, {
      ...snap,
      monitoring: { ...snap.monitoring, webhookStatus: status },
    });
  }

  bumpFailedImport(organizationId: string): void {
    const snap = this.get(organizationId);
    if (!snap) return;
    this.byOrg.set(organizationId, {
      ...snap,
      monitoring: {
        ...snap.monitoring,
        failures: snap.monitoring.failures + 1,
        health: "error",
        webhookStatus: "error",
      },
    });
  }
}

/** Process-wide Square sync cache (swap for durable store later). */
export const squareStore = new SquareNormalizedStore();
