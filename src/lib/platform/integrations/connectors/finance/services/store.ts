import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type {
  FinanceCanonicalEntity,
  FinanceProvider,
} from "@/lib/platform/integrations/connectors/finance/entities";

export type FinanceStoreSnapshot = {
  organizationId: string;
  provider: FinanceProvider;
  syncedAt: string | null;
  instanceId: string | null;
  records: FinanceCanonicalEntity[];
  byType: Record<string, FinanceCanonicalEntity[]>;
};

class FinanceNormalizedStore {
  /** key: `${organizationId}::${provider}` */
  private readonly byKey = new Map<string, FinanceStoreSnapshot>();

  private key(organizationId: string, provider: FinanceProvider): string {
    return `${organizationId}::${provider}`;
  }

  replace(
    organizationId: string,
    provider: FinanceProvider,
    instanceId: string,
    normalized: NormalizedRecord[]
  ): FinanceStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as FinanceCanonicalEntity);
    const byType: Record<string, FinanceCanonicalEntity[]> = {};
    for (const record of records) {
      byType[record.objectType] = byType[record.objectType] ?? [];
      byType[record.objectType]!.push(record);
    }
    const snapshot: FinanceStoreSnapshot = {
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

  get(organizationId: string, provider: FinanceProvider): FinanceStoreSnapshot | null {
    return (
      this.byKey.get(this.key(organizationId, provider)) ??
      this.byKey.get(this.key("exec-demo-org", provider)) ??
      null
    );
  }

  listForOrganization(organizationId: string): FinanceStoreSnapshot[] {
    const providers: FinanceProvider[] = ["quickbooks", "stripe", "square", "plaid"];
    return providers
      .map((provider) => this.get(organizationId, provider))
      .filter((s): s is FinanceStoreSnapshot => s != null);
  }

  allRecords(organizationId: string): FinanceCanonicalEntity[] {
    return this.listForOrganization(organizationId).flatMap((s) => s.records);
  }

  clear(organizationId?: string, provider?: FinanceProvider): void {
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

export const financeStore = new FinanceNormalizedStore();
