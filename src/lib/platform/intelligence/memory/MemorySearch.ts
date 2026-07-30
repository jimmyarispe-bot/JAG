/**
 * Institutional memory search — Sprint 204.
 */

import type { MemoryRecord, MemoryType } from "./MemoryRecord";

export type MemorySearchFilters = {
  readonly organizationId?: string;
  readonly type?: MemoryType | "all";
  readonly outcome?: string | "all";
  readonly q?: string;
  readonly decisionId?: string;
  readonly goalId?: string;
  readonly contributorId?: string;
  readonly policyId?: string;
  readonly tag?: string;
  readonly fromDate?: string;
  readonly toDate?: string;
  /** Convenience: risk / opportunity via type or tags */
  readonly facet?: "risk" | "opportunity" | "all";
};

export function searchMemories(
  records: readonly MemoryRecord[],
  filters: MemorySearchFilters = {}
): readonly MemoryRecord[] {
  const q = filters.q?.trim().toLowerCase() ?? "";

  return records.filter((r) => {
    if (
      filters.organizationId &&
      r.organizationId !== filters.organizationId
    ) {
      return false;
    }
    if (filters.type && filters.type !== "all" && r.type !== filters.type) {
      return false;
    }
    if (
      filters.outcome &&
      filters.outcome !== "all" &&
      r.outcome !== filters.outcome
    ) {
      return false;
    }
    if (filters.decisionId && !r.relatedDecisionIds.includes(filters.decisionId)) {
      return false;
    }
    if (filters.goalId && !r.relatedGoalIds.includes(filters.goalId)) {
      return false;
    }
    if (
      filters.contributorId &&
      !r.relatedContributorIds.includes(filters.contributorId)
    ) {
      return false;
    }
    if (filters.policyId && !r.relatedPolicyIds.includes(filters.policyId)) {
      return false;
    }
    if (
      filters.tag &&
      !r.tags.some((t) => t.toLowerCase() === filters.tag!.toLowerCase())
    ) {
      return false;
    }
    if (filters.fromDate && r.date < filters.fromDate) return false;
    if (filters.toDate && r.date > filters.toDate) return false;
    if (filters.facet === "risk") {
      if (r.type !== "risk_event" && !r.tags.some((t) => /risk/i.test(t))) {
        return false;
      }
    }
    if (filters.facet === "opportunity") {
      if (
        r.type !== "opportunity" &&
        !r.tags.some((t) => /opportunity/i.test(t))
      ) {
        return false;
      }
    }
    if (q) {
      const hay = [
        r.title,
        r.description,
        r.outcomeSummary ?? "",
        r.tags.join(" "),
        r.type,
        r.outcome,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
