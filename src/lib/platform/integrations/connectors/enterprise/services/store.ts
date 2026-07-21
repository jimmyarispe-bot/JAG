import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type {
  EnterpriseCanonicalEntity,
  EnterpriseProvider,
} from "@/lib/platform/integrations/connectors/enterprise/entities";
import { ENTERPRISE_PROVIDERS } from "@/lib/platform/integrations/connectors/enterprise/entities";

export type EnterpriseStoreSnapshot = {
  organizationId: string;
  provider: EnterpriseProvider;
  syncedAt: string | null;
  instanceId: string | null;
  records: EnterpriseCanonicalEntity[];
  byType: Record<string, EnterpriseCanonicalEntity[]>;
};

class EnterpriseNormalizedStore {
  private readonly byKey = new Map<string, EnterpriseStoreSnapshot>();

  private key(organizationId: string, provider: EnterpriseProvider): string {
    return `${organizationId}::${provider}`;
  }

  replace(
    organizationId: string,
    provider: EnterpriseProvider,
    instanceId: string,
    normalized: NormalizedRecord[]
  ): EnterpriseStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as EnterpriseCanonicalEntity);
    const byType: Record<string, EnterpriseCanonicalEntity[]> = {};
    for (const record of records) {
      byType[record.objectType] = byType[record.objectType] ?? [];
      byType[record.objectType]!.push(record);
    }
    const snapshot: EnterpriseStoreSnapshot = {
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
    provider: EnterpriseProvider
  ): EnterpriseStoreSnapshot | null {
    return (
      this.byKey.get(this.key(organizationId, provider)) ??
      this.byKey.get(this.key("exec-demo-org", provider)) ??
      null
    );
  }

  listForOrganization(organizationId: string): EnterpriseStoreSnapshot[] {
    return ENTERPRISE_PROVIDERS.map((provider) => this.get(organizationId, provider)).filter(
      (s): s is EnterpriseStoreSnapshot => s != null
    );
  }

  allRecords(organizationId: string): EnterpriseCanonicalEntity[] {
    return this.listForOrganization(organizationId).flatMap((s) => s.records);
  }

  clear(organizationId?: string, provider?: EnterpriseProvider): void {
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

export const enterpriseStore = new EnterpriseNormalizedStore();
