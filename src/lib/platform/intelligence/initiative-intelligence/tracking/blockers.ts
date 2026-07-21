/**
 * Blocker tracking for initiatives.
 */

import type {
  InitiativeBlocker,
  InitiativeOwnershipRole,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export function buildBlocker(
  createId: (prefix: string) => string,
  input: {
    title: string;
    summary: string;
    since: string;
    requiredApprovalRole?: InitiativeOwnershipRole;
    dependencyIds?: string[];
  }
): InitiativeBlocker {
  return {
    id: createId("blocker"),
    title: input.title,
    summary: input.summary,
    since: input.since,
    requiredApprovalRole: input.requiredApprovalRole,
    dependencyIds: input.dependencyIds ?? [],
  };
}
