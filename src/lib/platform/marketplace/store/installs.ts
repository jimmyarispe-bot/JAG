/**
 * In-memory marketplace install registry (CI / studio safe).
 * Records install intent only — never executes vendor sync or remote plugins.
 */

import type {
  MarketplaceInstallRecord,
  MarketplaceInstallStatus,
} from "@/lib/platform/marketplace/types";

class MarketplaceInstallStore {
  private readonly byOrg = new Map<string, Map<string, MarketplaceInstallRecord>>();

  list(organizationId: string): MarketplaceInstallRecord[] {
    return [...(this.byOrg.get(organizationId)?.values() ?? [])];
  }

  get(organizationId: string, listingKey: string): MarketplaceInstallRecord | null {
    return this.byOrg.get(organizationId)?.get(listingKey) ?? null;
  }

  upsert(record: MarketplaceInstallRecord): MarketplaceInstallRecord {
    let org = this.byOrg.get(record.organizationId);
    if (!org) {
      org = new Map();
      this.byOrg.set(record.organizationId, org);
    }
    org.set(record.listingKey, record);
    return record;
  }

  setStatus(
    organizationId: string,
    listingKey: string,
    status: MarketplaceInstallStatus
  ): MarketplaceInstallRecord | null {
    const existing = this.get(organizationId, listingKey);
    if (!existing) return null;
    const next = { ...existing, status };
    return this.upsert(next);
  }

  clear(organizationId?: string) {
    if (!organizationId) {
      this.byOrg.clear();
      return;
    }
    this.byOrg.delete(organizationId);
  }
}

export const marketplaceInstallStore = new MarketplaceInstallStore();
