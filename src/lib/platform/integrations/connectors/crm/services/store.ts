import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type {
  CrmCanonicalEntity,
  CrmProvider,
} from "@/lib/platform/integrations/connectors/crm/entities";
import { CRM_PROVIDERS } from "@/lib/platform/integrations/connectors/crm/entities";

export type CrmStoreSnapshot = {
  organizationId: string;
  provider: CrmProvider;
  syncedAt: string | null;
  instanceId: string | null;
  records: CrmCanonicalEntity[];
  byType: Record<string, CrmCanonicalEntity[]>;
};

class CrmNormalizedStore {
  private readonly byKey = new Map<string, CrmStoreSnapshot>();

  private key(organizationId: string, provider: CrmProvider): string {
    return `${organizationId}::${provider}`;
  }

  replace(
    organizationId: string,
    provider: CrmProvider,
    instanceId: string,
    normalized: NormalizedRecord[]
  ): CrmStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as CrmCanonicalEntity);
    const byType: Record<string, CrmCanonicalEntity[]> = {};
    for (const record of records) {
      byType[record.objectType] = byType[record.objectType] ?? [];
      byType[record.objectType]!.push(record);
    }
    const snapshot: CrmStoreSnapshot = {
      organizationId,
      provider,
      syncedAt,
      instanceId,
      records,
      byType,
    };
    this.byKey.set(this.key(organizationId, provider), snapshot);
    if (
      organizationId.endsWith("-demo") ||
      organizationId === "exec-demo-org" ||
      organizationId === "org-enterprise-demo"
    ) {
      this.byKey.set(this.key("exec-demo-org", provider), snapshot);
      // Enterprise graph soft-read compatibility for org-enterprise-demo demos.
      if (organizationId !== "org-enterprise-demo") {
        this.byKey.set(this.key("org-enterprise-demo", provider), snapshot);
      }
    }
    return snapshot;
  }

  get(organizationId: string, provider: CrmProvider): CrmStoreSnapshot | null {
    return (
      this.byKey.get(this.key(organizationId, provider)) ??
      this.byKey.get(this.key("exec-demo-org", provider)) ??
      null
    );
  }

  listForOrganization(organizationId: string): CrmStoreSnapshot[] {
    return CRM_PROVIDERS.map((provider) => this.get(organizationId, provider)).filter(
      (s): s is CrmStoreSnapshot => s != null
    );
  }

  allRecords(organizationId: string): CrmCanonicalEntity[] {
    return this.listForOrganization(organizationId).flatMap((s) => s.records);
  }

  clear(organizationId?: string, provider?: CrmProvider): void {
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

export const crmStore = new CrmNormalizedStore();
