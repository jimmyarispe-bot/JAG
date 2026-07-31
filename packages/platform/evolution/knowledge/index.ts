/**
 * Evolution knowledge helpers — lightweight local index of prior proposals.
 */

import { listProposals, listRequests } from "../store";

export function evolutionKnowledgeSummary(organizationId?: string): {
  readonly requestCount: number;
  readonly proposalCount: number;
  readonly topThemes: readonly string[];
} {
  const requests = listRequests(
    organizationId ? { organizationId, limit: 200 } : { limit: 200 }
  );
  const proposals = listProposals(
    organizationId ? { organizationId, limit: 200 } : { limit: 200 }
  );
  const themes = new Map<string, number>();
  for (const p of proposals) {
    themes.set(
      p.classification,
      (themes.get(p.classification) ?? 0) + 1
    );
  }
  const topThemes = [...themes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 5);
  return {
    requestCount: requests.length,
    proposalCount: proposals.length,
    topThemes: Object.freeze(topThemes),
  };
}
