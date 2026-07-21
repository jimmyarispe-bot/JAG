import type { NormalizedRecord } from "@/lib/platform/integrations/common/types";
import type {
  EducationCanonicalEntity,
  EducationProvider,
} from "@/lib/platform/integrations/connectors/education/entities";
import { EDUCATION_PROVIDERS } from "@/lib/platform/integrations/connectors/education/entities";

export type EducationStoreSnapshot = {
  organizationId: string;
  provider: EducationProvider;
  syncedAt: string | null;
  instanceId: string | null;
  records: EducationCanonicalEntity[];
  byType: Record<string, EducationCanonicalEntity[]>;
};

class EducationNormalizedStore {
  private readonly byKey = new Map<string, EducationStoreSnapshot>();

  private key(organizationId: string, provider: EducationProvider): string {
    return `${organizationId}::${provider}`;
  }

  replace(
    organizationId: string,
    provider: EducationProvider,
    instanceId: string,
    normalized: NormalizedRecord[]
  ): EducationStoreSnapshot {
    const syncedAt = new Date().toISOString();
    const records = normalized.map((n) => n.data as unknown as EducationCanonicalEntity);
    const byType: Record<string, EducationCanonicalEntity[]> = {};
    for (const record of records) {
      byType[record.objectType] = byType[record.objectType] ?? [];
      byType[record.objectType]!.push(record);
    }
    const snapshot: EducationStoreSnapshot = {
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
      if (organizationId !== "org-enterprise-demo") {
        this.byKey.set(this.key("org-enterprise-demo", provider), snapshot);
      }
    }
    return snapshot;
  }

  get(organizationId: string, provider: EducationProvider): EducationStoreSnapshot | null {
    return (
      this.byKey.get(this.key(organizationId, provider)) ??
      this.byKey.get(this.key("exec-demo-org", provider)) ??
      null
    );
  }

  listForOrganization(organizationId: string): EducationStoreSnapshot[] {
    return EDUCATION_PROVIDERS.map((provider) => this.get(organizationId, provider)).filter(
      (s): s is EducationStoreSnapshot => s != null
    );
  }

  allRecords(organizationId: string): EducationCanonicalEntity[] {
    return this.listForOrganization(organizationId).flatMap((s) => s.records);
  }

  clear(organizationId?: string, provider?: EducationProvider): void {
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

export const educationStore = new EducationNormalizedStore();
