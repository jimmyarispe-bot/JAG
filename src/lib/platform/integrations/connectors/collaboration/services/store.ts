import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type {
  CollaborationCanonicalEntity,
  CollaborationProvider,
} from "@/lib/platform/integrations/connectors/collaboration/entities";
import { COLLABORATION_PROVIDERS } from "@/lib/platform/integrations/connectors/collaboration/entities";

export type CollaborationStoreSnapshot = {
  organizationId: string;
  provider: CollaborationProvider;
  syncedAt: string | null;
  instanceId: string | null;
  records: CollaborationCanonicalEntity[];
  byType: Record<string, CollaborationCanonicalEntity[]>;
};

class CollaborationNormalizedStore {
  /** key: `${organizationId}::${provider}` */
  private readonly byKey = new Map<string, CollaborationStoreSnapshot>();

  private key(organizationId: string, provider: CollaborationProvider): string {
    return `${organizationId}::${provider}`;
  }

  replace(
    organizationId: string,
    provider: CollaborationProvider,
    instanceId: string,
    normalized: NormalizedRecord[]
  ): CollaborationStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as CollaborationCanonicalEntity);
    const byType: Record<string, CollaborationCanonicalEntity[]> = {};
    for (const record of records) {
      byType[record.objectType] = byType[record.objectType] ?? [];
      byType[record.objectType]!.push(record);
    }
    const snapshot: CollaborationStoreSnapshot = {
      organizationId,
      provider,
      syncedAt,
      instanceId,
      records,
      byType,
    };
    this.byKey.set(this.key(organizationId, provider), snapshot);
    if (organizationId.endsWith("-demo") || organizationId === "exec-demo-org") {
      this.byKey.set(this.key("exec-demo-org", provider), snapshot);
    }
    return snapshot;
  }

  get(
    organizationId: string,
    provider: CollaborationProvider
  ): CollaborationStoreSnapshot | null {
    return (
      this.byKey.get(this.key(organizationId, provider)) ??
      this.byKey.get(this.key("exec-demo-org", provider)) ??
      null
    );
  }

  listForOrganization(organizationId: string): CollaborationStoreSnapshot[] {
    return COLLABORATION_PROVIDERS.map((provider) =>
      this.get(organizationId, provider)
    ).filter((s): s is CollaborationStoreSnapshot => s != null);
  }

  allRecords(organizationId: string): CollaborationCanonicalEntity[] {
    return this.listForOrganization(organizationId).flatMap((s) => s.records);
  }

  clear(organizationId?: string, provider?: CollaborationProvider): void {
    if (!organizationId) {
      this.byKey.clear();
      return;
    }
    if (provider) {
      this.byKey.delete(this.key(organizationId, provider));
      return;
    }
    for (const key of [...this.byKey.keys()]) {
      if (key.startsWith(`${organizationId}::`)) this.byKey.delete(key);
    }
  }
}

export const collaborationStore = new CollaborationNormalizedStore();
