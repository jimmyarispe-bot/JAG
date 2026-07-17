/**
 * In-memory store for normalized AcademyOS entities (integration cache, not SoR).
 */

import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type { AcademyOsCanonicalEntity } from "./entities";

export type AcademyOsStoreSnapshot = {
  organizationId: string;
  syncedAt: string | null;
  instanceId: string | null;
  records: AcademyOsCanonicalEntity[];
  byType: Record<string, AcademyOsCanonicalEntity[]>;
};

class AcademyOsNormalizedStore {
  private readonly byOrg = new Map<string, AcademyOsStoreSnapshot>();

  replace(organizationId: string, instanceId: string, normalized: NormalizedRecord[]): AcademyOsStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as AcademyOsCanonicalEntity);
    const byType: Record<string, AcademyOsCanonicalEntity[]> = {};
    for (const record of records) {
      const key = record.objectType;
      byType[key] = byType[key] ?? [];
      byType[key]!.push(record);
    }
    const snapshot: AcademyOsStoreSnapshot = {
      organizationId,
      syncedAt,
      instanceId,
      records,
      byType,
    };
    this.byOrg.set(organizationId, snapshot);
    // Alias ECC demo org
    if (organizationId === "org-academy-demo") {
      this.byOrg.set("exec-demo-org", snapshot);
    }
    if (organizationId === "exec-demo-org") {
      this.byOrg.set("org-academy-demo", snapshot);
    }
    return snapshot;
  }

  get(organizationId: string): AcademyOsStoreSnapshot | null {
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
}

/** Process-wide AcademyOS sync cache (swap for durable store later). */
export const academyOsStore = new AcademyOsNormalizedStore();
