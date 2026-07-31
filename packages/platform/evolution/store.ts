/**
 * In-process Evolution store (tests / single-process).
 */

import type {
  EvolutionAnalyticsSnapshot,
  EvolutionCaptureRequest,
  EvolutionProposal,
} from "./types";

type EvolutionStore = {
  requests: Map<string, EvolutionCaptureRequest>;
  proposals: Map<string, EvolutionProposal>;
};

const g = globalThis as typeof globalThis & {
  __jagEvolutionStore?: EvolutionStore;
};

function empty(): EvolutionStore {
  return {
    requests: new Map(),
    proposals: new Map(),
  };
}

function store(): EvolutionStore {
  if (!g.__jagEvolutionStore) g.__jagEvolutionStore = empty();
  return g.__jagEvolutionStore;
}

export function resetEvolutionStoreForTests(): void {
  g.__jagEvolutionStore = empty();
}

export function upsertRequest(
  req: EvolutionCaptureRequest
): EvolutionCaptureRequest {
  store().requests.set(req.requestId, req);
  return req;
}

export function getRequest(id: string): EvolutionCaptureRequest | null {
  return store().requests.get(id) ?? null;
}

export function listRequests(filter?: {
  organizationId?: string;
  status?: EvolutionCaptureRequest["status"];
  limit?: number;
}): readonly EvolutionCaptureRequest[] {
  let rows = [...store().requests.values()];
  if (filter?.organizationId) {
    rows = rows.filter((r) => r.organizationId === filter.organizationId);
  }
  if (filter?.status) {
    rows = rows.filter((r) => r.status === filter.status);
  }
  rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return Object.freeze(rows.slice(0, filter?.limit ?? 100));
}

export function upsertProposal(
  proposal: EvolutionProposal
): EvolutionProposal {
  store().proposals.set(proposal.proposalId, proposal);
  return proposal;
}

export function getProposal(id: string): EvolutionProposal | null {
  return store().proposals.get(id) ?? null;
}

export function getProposalByRequest(
  requestId: string
): EvolutionProposal | null {
  return (
    [...store().proposals.values()].find((p) => p.requestId === requestId) ??
    null
  );
}

export function listProposals(filter?: {
  organizationId?: string;
  classification?: string;
  status?: EvolutionProposal["status"];
  limit?: number;
}): readonly EvolutionProposal[] {
  let rows = [...store().proposals.values()];
  if (filter?.status) {
    rows = rows.filter((p) => p.status === filter.status);
  }
  if (filter?.classification) {
    rows = rows.filter((p) => p.classification === filter.classification);
  }
  if (filter?.organizationId) {
    const orgIds = new Set(
      listRequests({ organizationId: filter.organizationId }).map(
        (r) => r.requestId
      )
    );
    rows = rows.filter((p) => orgIds.has(p.requestId));
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Object.freeze(rows.slice(0, filter?.limit ?? 100));
}

export function buildEvolutionAnalytics(
  organizationId?: string
): EvolutionAnalyticsSnapshot {
  const proposals = listProposals(
    organizationId ? { organizationId, limit: 500 } : { limit: 500 }
  );
  const requests = listRequests(
    organizationId ? { organizationId, limit: 500 } : { limit: 500 }
  );
  const byClassification: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const p of proposals) {
    byClassification[p.classification] =
      (byClassification[p.classification] ?? 0) + 1;
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }
  for (const r of requests) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  const avgConf =
    proposals.length === 0
      ? 0
      : Math.round(
          proposals.reduce((a, p) => a + p.confidenceScore, 0) /
            proposals.length
        );
  const avgPri =
    proposals.length === 0
      ? 0
      : Math.round(
          proposals.reduce((a, p) => a + p.priority.total, 0) / proposals.length
        );
  const dupes = proposals.filter((p) => p.status === "duplicate").length;

  return {
    generatedAt: new Date().toISOString(),
    captureCount: requests.length,
    proposalCount: proposals.length,
    byClassification: Object.freeze(byClassification),
    byStatus: Object.freeze(byStatus),
    averageConfidence: avgConf,
    averagePriority: avgPri,
    duplicateRate:
      proposals.length === 0
        ? 0
        : Math.round((dupes / proposals.length) * 100),
  };
}
