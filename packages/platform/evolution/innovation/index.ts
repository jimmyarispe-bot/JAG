/**
 * Innovation candidates — flagged proposals only (does not start Innovation sprint).
 */

import { listProposals } from "../store";
import type { EvolutionProposal } from "../types";

export function listInnovationCandidates(filter?: {
  organizationId?: string;
  limit?: number;
}): readonly EvolutionProposal[] {
  return listProposals({
    organizationId: filter?.organizationId,
    classification: "Innovation Proposal",
    limit: filter?.limit ?? 20,
  });
}

export function listPerCandidates(filter?: {
  organizationId?: string;
  limit?: number;
}): readonly EvolutionProposal[] {
  return listProposals({
    organizationId: filter?.organizationId,
    classification: "Platform Enhancement (PER)",
    limit: filter?.limit ?? 20,
  });
}
