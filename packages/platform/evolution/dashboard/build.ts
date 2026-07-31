/**
 * Evolution dashboard aggregates.
 */

import {
  listProposals,
  listRequests,
} from "../store";
import type { EvolutionDashboard } from "../types";
import {
  listInnovationCandidates,
  listPerCandidates,
} from "../innovation";

export function buildEvolutionDashboard(organizationId?: string): EvolutionDashboard {
  const newestIdeas = listRequests({
    organizationId,
    limit: 12,
  });
  const proposals = listProposals({
    organizationId,
    limit: 200,
  });

  const themeCounts = new Map<string, number>();
  for (const r of newestIdeas) {
    const key = r.title.toLowerCase().slice(0, 48);
    themeCounts.set(key, (themeCounts.get(key) ?? 0) + 1);
  }
  for (const p of proposals) {
    const key = p.understanding.affectedWorkflow;
    themeCounts.set(key, (themeCounts.get(key) ?? 0) + 1);
  }
  const mostRequested = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => Object.freeze({ key, count }));

  const highestValue = [...proposals]
    .sort((a, b) => b.priority.total - a.priority.total)
    .slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    newestIdeas,
    mostRequested: Object.freeze(mostRequested),
    highestValue: Object.freeze(highestValue),
    duplicates: Object.freeze(
      proposals.filter((p) => p.status === "duplicate")
    ),
    implemented: Object.freeze(
      proposals.filter((p) => p.status === "implemented")
    ),
    rejected: Object.freeze(
      proposals.filter((p) => p.status === "rejected")
    ),
    inReview: Object.freeze(
      proposals.filter((p) => p.status === "in_review" || p.status === "proposal_ready")
    ),
    innovationCandidates: listInnovationCandidates({ organizationId }),
    perCandidates: listPerCandidates({ organizationId }),
  };
}
