import type {
  DecisionOwnerRole,
  DecisionPriority,
  PlatformDecision,
} from "@/lib/platform/decisions/types";

export function buildDecisionMergeKey(input: {
  organizationId: string | null;
  recommendationId: string;
}): string {
  return `org:${input.organizationId ?? "platform"}:rec:${input.recommendationId}`;
}

/** Stable merge key for automation-created decisions (Sprint 068). */
export function buildAutomationDecisionMergeKey(input: {
  organizationId: string | null;
  ruleId: string;
  subjectKey: string;
}): string {
  return `org:${input.organizationId ?? "platform"}:auto:${input.ruleId}:${input.subjectKey}`;
}

export function createDecisionId(mergeKey: string, createdAt: string): string {
  // Deterministic id for reproducibility in tests / sync.
  return `decision:${mergeKey}:${createdAt.slice(0, 10)}`;
}

export function emptyStatusCounts(): Record<
  PlatformDecision["status"],
  number
> {
  return {
    open: 0,
    assigned: 0,
    in_progress: 0,
    waiting: 0,
    completed: 0,
    dismissed: 0,
  };
}

export function countByStatus(
  decisions: PlatformDecision[]
): Record<PlatformDecision["status"], number> {
  const counts = emptyStatusCounts();
  for (const d of decisions) {
    counts[d.status] += 1;
  }
  return counts;
}

export function dueDateFrom(nowIso: string, dueInDays: number): string {
  const d = new Date(nowIso);
  d.setUTCDate(d.getUTCDate() + dueInDays);
  return d.toISOString();
}

export function priorityRank(priority: DecisionPriority): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[priority];
}

export function sortDecisions(decisions: PlatformDecision[]): PlatformDecision[] {
  return [...decisions].sort((a, b) => {
    const pr = priorityRank(b.priority) - priorityRank(a.priority);
    if (pr !== 0) return pr;
    const aOpen = a.status === "completed" || a.status === "dismissed" ? 1 : 0;
    const bOpen = b.status === "completed" || b.status === "dismissed" ? 1 : 0;
    if (aOpen !== bOpen) return aOpen - bOpen;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function isActiveDecision(decision: PlatformDecision): boolean {
  return decision.status !== "completed" && decision.status !== "dismissed";
}

export function defaultOwnerForPriority(
  priority: DecisionPriority
): DecisionOwnerRole {
  if (priority === "critical" || priority === "high") return "founder";
  return "executive_director";
}
