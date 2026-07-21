import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type {
  HrCanonicalEntity,
  HrProvider,
} from "@/lib/platform/integrations/connectors/hr/entities";
import { HR_PROVIDERS } from "@/lib/platform/integrations/connectors/hr/entities";

export type HrStoreSnapshot = {
  organizationId: string;
  provider: HrProvider;
  syncedAt: string | null;
  instanceId: string | null;
  records: HrCanonicalEntity[];
  byType: Record<string, HrCanonicalEntity[]>;
};

class HrNormalizedStore {
  private readonly byKey = new Map<string, HrStoreSnapshot>();

  private key(organizationId: string, provider: HrProvider): string {
    return `${organizationId}::${provider}`;
  }

  replace(
    organizationId: string,
    provider: HrProvider,
    instanceId: string,
    normalized: NormalizedRecord[]
  ): HrStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as HrCanonicalEntity);
    const byType: Record<string, HrCanonicalEntity[]> = {};
    for (const record of records) {
      byType[record.objectType] = byType[record.objectType] ?? [];
      byType[record.objectType]!.push(record);
    }
    const snapshot: HrStoreSnapshot = {
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

  get(organizationId: string, provider: HrProvider): HrStoreSnapshot | null {
    return (
      this.byKey.get(this.key(organizationId, provider)) ??
      this.byKey.get(this.key("exec-demo-org", provider)) ??
      null
    );
  }

  listForOrganization(organizationId: string): HrStoreSnapshot[] {
    return HR_PROVIDERS.map((provider) => this.get(organizationId, provider)).filter(
      (s): s is HrStoreSnapshot => s != null
    );
  }

  allRecords(organizationId: string): HrCanonicalEntity[] {
    return this.listForOrganization(organizationId).flatMap((s) => s.records);
  }

  clear(organizationId?: string, provider?: HrProvider): void {
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

export const hrStore = new HrNormalizedStore();
