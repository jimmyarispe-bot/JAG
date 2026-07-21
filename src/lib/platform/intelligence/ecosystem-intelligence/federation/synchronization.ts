/**
 * Federation synchronization — contract-driven refresh of authorized summaries.
 * Does not pull raw tenant records.
 */

import type { FederatedOrgSummary } from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export interface FederationSyncResult {
  synchronizedAt: string;
  organizationIds: string[];
  summaryCount: number;
}

export function synchronizeFederatedSummaries(
  summaries: FederatedOrgSummary[],
  nowIso: string
): FederationSyncResult {
  return {
    synchronizedAt: nowIso,
    organizationIds: summaries.map((s) => s.organizationId),
    summaryCount: summaries.length,
  };
}
